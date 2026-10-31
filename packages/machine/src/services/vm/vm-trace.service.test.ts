import { describe, expect, it } from 'vitest'
import { createVmTrace } from '#services/vm/vm-trace.service'
import type { TracedCommand } from '#types/definitions/vm-trace'

// Real trace_pipe formats from the VM's kernel; `cat` exits 1 after writing "hi\n".
const line = (pid: number, comm: string, ts: string, payload: string) =>
  `${comm.padStart(16)}-${pid}     [000] .....   ${ts}: ${payload}\n`
const RET = '(ia32_sys_call+0x1f3b/0x2230 <- __ia32_sys_writev)'

const SESSION = [
  line(434, 'bash', '5.000000', 'sys_write(fd: 9, buf: 0xbf9486a0, count: 0x20)'),
  line(434, 'bash', '5.000010', 'tracing_mark_write: kf-start     7  cat /etc/hostname'),
  line(434, 'bash', '5.000020', 'sys_write -> 0x20'),
  line(434, 'bash', '5.000100', 'sys_fork()'),
  line(434, 'bash', '5.000200', 'sched_process_fork: comm=bash pid=434 child_comm=bash child_pid=441'),
  line(434, 'bash', '5.000210', 'sys_fork -> 0x1b9'),
  line(441, 'bash', '5.000300', 'sys_execve(filename: 0xb7dd3950, argv: 0xb7de7470, envp: 0xb7e02ac0)'),
  line(
    441,
    'bash',
    '5.000310',
    'execve: (syscalls.sys_enter_execve) path="/bin/cat" a0="cat" a1="/etc/hostname" a2=(fault)'
  ),
  line(441, 'cat', '5.000400', 'sched_process_exec: filename=/bin/cat pid=441 old_pid=441'),
  line(441, 'cat', '5.000410', 'sys_execve -> 0x0'),
  line(441, 'cat', '5.000500', 'page_fault_user: address=0xbfbebf30 ip=0xb7f17e39 error_code=0x7'),
  line(441, 'cat', '5.000600', 'sys_open(filename: 0x4b8b00, flags: 0x8000, mode: 0x0)'),
  line(441, 'cat', '5.000610', 'path_open: (ia32_sys_call+0x4a/0x2230 <- __ia32_sys_open) p0="/etc/hostname"'),
  line(441, 'cat', '5.000620', 'sys_open -> 0xfffffffe'),
  line(441, 'cat', '5.000700', 'sys_writev(fd: 1, vec: 0xbf9486a0, vlen: 2)'),
  line(441, 'cat', '5.000705', 'tty_0: (n_tty_write+0x0/0x4e0) nr=0x2 b0=0x6968 b1=0x0'),
  line(441, 'cat', '5.000706', 'tty_0: (n_tty_write+0x0/0x4e0) nr=0x1 b0=0xa b1=0x0'),
  line(441, 'cat', '5.000710', `writev_1_0: ${RET} fd=1 n=2 ret=3 l=1 b0=0xa b1=0x0`),
  line(441, 'cat', '5.000711', `writev_0_0: ${RET} fd=1 n=2 ret=3 l=2 b0=0x6968 b1=0x0`),
  line(441, 'cat', '5.000720', 'sys_writev -> 0x3'),
  line(441, 'cat', '5.000800', 'sys_exit_group(error_code: 0x1)'),
  line(441, 'cat', '5.000810', 'sched_process_exit: comm=cat pid=441 prio=120 group_dead=true'),
  line(441, 'cat', '5.000900', 'signal_generate: sig=17 errno=0 code=1 comm=bash pid=434 grp=1 res=0'),
  line(434, 'bash', '5.001000', 'signal_deliver: sig=17 errno=0 code=1 sa_handler=4d5f55 sa_flags=14000000'),
  line(434, 'bash', '5.001100', 'sys_write(fd: 9, buf: 0xbf9486a0, count: 0x9)'),
  line(434, 'bash', '5.001110', 'tracing_mark_write: kf-end 1'),
  line(434, 'bash', '5.001120', 'sys_write -> 0x9'),
].join('')

function run(text: string, chunk = text.length) {
  const finished: TracedCommand[] = []
  const progress: TracedCommand[] = []
  const trace = createVmTrace({ onProgress: (c) => progress.push(c), onFinished: (c) => finished.push(c) })
  for (let i = 0; i < text.length; i += chunk) {
    trace.pushTrace(text.slice(i, i + chunk))
  }
  return { finished, progress, trace }
}

const text = (bytes: Uint8Array | undefined) => new TextDecoder().decode(bytes)

describe('the VM trace', () => {
  it('turns the marked command into one finished run with its line and exit status', () => {
    const { finished } = run(SESSION)
    expect(finished).toHaveLength(1)
    expect(finished[0]?.commandLine).toBe('cat /etc/hostname')
    expect(finished[0]?.status).toBe(1)
  })

  it("leaves out the shell's own marker writes, and numbers the events in order", () => {
    const events = run(SESSION).finished[0]?.events ?? []
    expect(events[0]).toMatchObject({ type: 'sys_enter', name: 'fork', nr: 2, pid: 434, seq: 0, time: 5_000_100_000 })
    expect(events.at(-1)).toMatchObject({ type: 'signal_deliver', pid: 434, sig: 17 })
    expect(events.map((e) => e.seq)).toEqual(events.map((_, i) => i))
  })

  it('attaches what the probes read: argv, paths and written bytes, with i386 numbers', () => {
    const events = run(SESSION).finished[0]?.events ?? []
    const enter = (name: string) => {
      const found = events.find((e) => e.type === 'sys_enter' && e.name === name)
      return found?.type === 'sys_enter' ? found : undefined
    }
    expect(enter('execve')).toMatchObject({ nr: 11, argv: ['cat', '/etc/hostname'] })
    expect(text(enter('open')?.data)).toBe('/etc/hostname')
    expect(text(enter('writev')?.data)).toBe('hi\n')
    expect(enter('writev')).not.toHaveProperty('dataCut')
    expect(events.find((e) => e.type === 'sys_exit' && e.name === 'open')).toMatchObject({ ret: -2, nr: 5 })
  })

  it('records what reached the terminal in order, between the write that sent it and the exit', () => {
    const events = run(SESSION).finished[0]?.events ?? []
    const consoles = events.flatMap((e, i) => (e.type === 'console_write' ? [{ i, e }] : []))
    expect(consoles.map(({ e }) => (e.type === 'console_write' ? [e.pid, text(e.bytes)] : null))).toEqual([
      [441, 'hi'],
      [441, '\n'],
    ])
    const writev = events.findIndex((e) => e.type === 'sys_enter' && e.name === 'writev')
    const exit = events.findIndex((e) => e.type === 'sched_process_exit')
    expect(consoles.every(({ i }) => i > writev && i < exit)).toBe(true)
  })

  it('reads processes the way the model names them: fork, exec, exit code, signals', () => {
    const events = run(SESSION).finished[0]?.events ?? []
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'sched_process_fork', parentPid: 434, childPid: 441 })
    )
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'sched_process_exec', pid: 441, oldPid: 441, filename: '/bin/cat' })
    )
    expect(events).toContainEqual(expect.objectContaining({ type: 'sched_process_exit', pid: 441, code: 1 }))
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'signal_generate', pid: 434, sig: 17, result: 'delivered' })
    )
  })

  it("attaches read()'s data to its exit, and says when the call moved more than was captured", () => {
    const probe = (chunk: number, ret: string, b0: string, b1: string) =>
      `read_${chunk}: (__ia32_sys_read+0x10/0x20 <- ksys_read) fd=0x3 ret=${ret} b0=${b0} b1=${b1} b2=0x0`
    const commandText = [
      line(434, 'bash', '6.0', 'tracing_mark_write: kf-start     2  head -c 3 /etc/passwd'),
      line(448, 'head', '6.1', 'sys_read(fd: 3, buf: 0xb7ee50b0, count: 0x400)'),
      line(448, 'head', '6.2', probe(0, '6', '0x746f6f72', '0x303a')),
      line(448, 'head', '6.3', 'sys_read -> 0x6'),
      line(448, 'head', '6.4', 'sys_read(fd: 3, buf: 0xb7ee50b0, count: 0x2000)'),
      line(448, 'head', '6.5', probe(0, '2000', '0x746f6f72', '0x303a')),
      line(448, 'head', '6.6', 'sys_read -> 0x7d0'),
      line(448, 'head', '6.7', 'sys_read(fd: 3, buf: 0xb7ee50b0, count: 0x400)'),
      line(448, 'head', '6.8', probe(0, '0', '0x746f6f72', '0x303a')),
      line(448, 'head', '6.9', 'sys_read -> 0x0'),
      line(434, 'bash', '7.0', 'tracing_mark_write: kf-end 0'),
    ].join('')
    const exits = (run(commandText).finished[0]?.events ?? []).filter((e) => e.type === 'sys_exit')
    expect(exits[0]).toMatchObject({ nr: 3, ret: 6 })
    expect(text(exits[0]?.type === 'sys_exit' ? exits[0].data : undefined)).toBe('root:0')
    expect(exits[1]).toMatchObject({ ret: 2000, dataCut: true })
    expect(exits[1]?.type === 'sys_exit' && exits[1].data?.length).toBe(256)
    expect(exits[2]).not.toHaveProperty('data')
  })

  it('keeps a page fault only when SIGSEGV follows it', () => {
    expect(run(SESSION).finished[0]?.events.some((e) => e.type === 'page_fault_user')).toBe(false)
    const crash = SESSION.replace(
      'signal_generate: sig=17 errno=0 code=1 comm=bash pid=434',
      'signal_generate: sig=11 errno=0 code=1 comm=cat pid=441'
    )
    const events = run(crash).finished[0]?.events ?? []
    const fault = events.findIndex((e) => e.type === 'page_fault_user')
    expect(events[fault]).toMatchObject({ pid: 441, address: 0xbfbebf30, errorCode: 7 })
    expect(events[fault + 1]).toMatchObject({ type: 'signal_generate', sig: 11 })
  })

  it('puts lines back together across chunks, and reports progress while the command runs', () => {
    const { finished, progress } = run(SESSION, 37)
    expect(finished[0]?.events).toEqual(run(SESSION).finished[0]?.events)
    expect(progress.length).toBeGreaterThan(0)
    expect(progress[0]?.status).toBeNull()
  })

  it('gives what the shell did before a command (completing a name with Tab) to that command', () => {
    const tab = [
      line(434, 'bash', '1.0', 'sys_open(filename: 0x4b8b00, flags: 0x98800, mode: 0x0)'),
      line(434, 'bash', '1.1', 'path_open: (ia32_sys_call+0x4a/0x2230 <- __ia32_sys_open) p0="."'),
      line(434, 'bash', '1.2', 'sys_open -> 0x3'),
      line(434, 'bash', '1.3', 'sys_getdents64(fd: 3, dirent: 0x4e8000, count: 0x800)'),
      line(434, 'bash', '1.4', 'sys_getdents64 -> 0x60'),
    ].join('')
    const { finished } = run(tab + SESSION)
    const events = finished[0]?.events ?? []
    expect(events.slice(0, 4).map((e) => (e.type === 'sys_enter' || e.type === 'sys_exit' ? e.name : e.type))).toEqual([
      'open',
      'open',
      'getdents64',
      'getdents64',
    ])
    expect(text(events[0]?.type === 'sys_enter' ? events[0].data : undefined)).toBe('.')
    expect(events[4]).toMatchObject({ type: 'sys_enter', name: 'fork' })
  })

  it("drops PS0's funsub cleanup that leads a command, but keeps a builtin's own write after it", () => {
    const echo = [
      line(434, 'bash', '6.0000', 'sys_write(fd: 9, buf: 0xbf9486a0, count: 0x20)'),
      line(434, 'bash', '6.0001', 'tracing_mark_write: kf-start     9  echo hi'),
      line(434, 'bash', '6.0002', 'sys_write -> 0x20'),
      line(434, 'bash', '6.0003', 'sys_dup2(oldfd: 0xa, newfd: 0x1)'),
      line(434, 'bash', '6.0004', 'sys_dup2 -> 0x1'),
      line(434, 'bash', '6.0005', 'sys_read(fd: 3, buf: 0xbfc99f5b, count: 0x80)'),
      line(434, 'bash', '6.0006', 'sys_read -> 0x0'),
      line(434, 'bash', '6.0007', 'sys_close(fd: 3)'),
      line(434, 'bash', '6.0008', 'sys_close -> 0x0'),
      line(434, 'bash', '6.0009', 'sys_writev(fd: 1, vec: 0xbf9486a0, vlen: 1)'),
      line(434, 'bash', '6.0010', 'sys_writev -> 0x3'),
      line(434, 'bash', '6.0011', 'sys_close(fd: 4)'),
      line(434, 'bash', '6.0012', 'sys_close -> 0x0'),
      line(434, 'bash', '6.0013', 'sys_write(fd: 9, buf: 0xbf9486a0, count: 0x9)'),
      line(434, 'bash', '6.0014', 'tracing_mark_write: kf-end 0'),
      line(434, 'bash', '6.0015', 'sys_write -> 0x9'),
    ].join('')
    const { finished } = run(echo)
    const calls = (finished[0]?.events ?? []).flatMap((e) => (e.type === 'sys_enter' ? [e.name] : []))
    // The close after the builtin's write is the command's, not the funsub's.
    expect(calls).toEqual(['writev', 'close'])
  })

  it("drops the shell's start-up before its first prompt: a new shell's execs aren't the first command's", () => {
    const startup = [
      line(434, 'su', '0.1', 'sched_process_exec: filename=/bin/bash pid=434 old_pid=434'),
      line(434, 'bash', '0.2', 'sys_stat64(filename: 0x4e8000, statbuf: 0xbfc99000)'),
      line(434, 'bash', '0.3', 'sys_stat64 -> 0x0'),
      line(434, 'bash', '0.4', 'tracing_mark_write: kf-end 0'),
    ].join('')
    const { finished } = run(startup + SESSION)
    expect(finished).toHaveLength(1)
    const events = finished[0]?.events ?? []
    expect(events.some((e) => e.type === 'sched_process_exec' && e.filename === '/bin/bash')).toBe(false)
    expect(events[0]).toMatchObject({ type: 'sys_enter', name: 'fork' })
  })

  it("leaves out the shell's line editing between commands: keys, echo, prompt", () => {
    const editing = [
      line(434, 'bash', '8.0', 'sys_read(fd: 0, buf: 0xbfc99f5b, count: 1)'),
      line(434, 'bash', '8.1', 'read_0: (__ia32_sys_read+0x10/0x20 <- ksys_read) fd=0x0 ret=1 b0=0x6c'),
      line(434, 'bash', '8.2', 'sys_read -> 0x1'),
      line(434, 'bash', '8.3', 'sys_writev(fd: 2, vec: 0xbfc9abb8, vlen: 1)'),
      line(434, 'bash', '8.4', 'tty_0: (n_tty_write+0x0/0x4e0) nr=0x1 b0=0x6c'),
      line(434, 'bash', '8.5', `writev_0_0: ${RET} fd=2 n=1 ret=1 l=1 b0=0x6c`),
      line(434, 'bash', '8.6', 'sys_writev -> 0x1'),
      line(434, 'bash', '8.7', 'sys_stat64(filename: 0x4e8000, statbuf: 0xbfc99000)'),
      line(434, 'bash', '8.8', 'sys_stat64 -> 0x0'),
    ].join('')
    const next = SESSION.replace('kf-start     7  cat /etc/hostname', 'kf-start     8  ls')
    const { finished } = run(SESSION + editing + next)
    const events = finished[1]?.events ?? []
    expect(events.slice(0, 3).map((e) => (e.type === 'sys_enter' || e.type === 'sys_exit' ? e.name : e.type))).toEqual([
      'stat64',
      'stat64',
      'fork',
    ])
  })

  it("makes another user's command a run of its own, keeping the player's idle time for the player", () => {
    const tab = line(434, 'bash', '0.5', 'sys_stat64(filename: 0x4e8000, statbuf: 0xbfc99000)')
    const knock = [
      line(473, 'sh', '1.0', 'sys_write -> 0x4'),
      line(473, 'sh', '1.1', 'sys_write(fd: 9, buf: 0xbf000000, count: 0x10)'),
      line(473, 'sh', '1.2', 'tracing_mark_write: kf-as-start cat /home/you/secret'),
      line(473, 'sh', '1.3', 'sys_write -> 0x10'),
      line(474, 'cat', '1.4', 'sys_open(filename: 0x4b8b00, flags: 0x8000, mode: 0x0)'),
      line(474, 'cat', '1.5', 'sys_open -> 0xfffffff3'),
      line(473, 'sh', '1.6', 'sys_write(fd: 9, buf: 0xbf000000, count: 0xc)'),
      line(473, 'sh', '1.7', 'tracing_mark_write: kf-as-end 1'),
    ].join('')
    const { finished } = run(tab + knock + SESSION)
    expect(finished.map((c) => [c.commandLine, c.status])).toEqual([
      ['cat /home/you/secret', 1],
      ['cat /etc/hostname', 1],
    ])
    expect(finished[0]?.events.map((e) => (e.type === 'sys_exit' ? e.ret : e.type))).toEqual(['sys_enter', -13])
    expect(finished[1]?.events[0]).toMatchObject({ type: 'sys_enter', name: 'stat64', pid: 434 })
    expect(finished[1]?.events[1]).toMatchObject({ type: 'sys_enter', name: 'fork' })
  })

  it('numbers a syscall through its tracepoint name, keeping that name', () => {
    const uname = [
      line(434, 'bash', '2.0', 'tracing_mark_write: kf-start     1  uname'),
      line(450, 'uname', '2.1', 'sys_newuname(name: 0xbf8e1000)'),
      line(450, 'uname', '2.2', 'sys_newuname -> 0x0'),
      line(434, 'bash', '2.3', 'tracing_mark_write: kf-end 0'),
    ].join('')
    expect(run(uname).finished[0]?.events[0]).toMatchObject({ name: 'newuname', nr: 122 })
  })
})
