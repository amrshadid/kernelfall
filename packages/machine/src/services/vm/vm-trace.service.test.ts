import { describe, expect, it } from 'vitest'
import type { LabEvent } from '#events/types'
import { createVmTrace } from '#services/vm/vm-trace.service'
import type { TracedCommand } from '#types/definitions/vm-trace'
import { mergeProgress, spliceEvents } from '#utils/vm-trace/trace-progress.util'

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

  it('attaches what sendfile64 moved to its exit: the copy out of /proc, or what reached the terminal', () => {
    // Real lines: BusyBox cat copying /proc/version into a file, then /etc/hostname to the terminal.
    const commandText = [
      '            bash-468     [000] ...1.    75.406288: tracing_mark_write: kf-start    10  cat /proc/version > /tmp/y\n',
      '             cat-517     [000] .....    75.448191: sys_sendfile64(out_fd: 1, in_fd: 3, offset: 0, count: 0x1000000)\n',
      '             cat-517     [000] .N...    75.448702: splice_0: (_copy_to_iter+0x0/0x6f0) n=0xa4 t=2 b0=0x756e694c b1=0x65762078 b2=0x6f697372 b3=0x2e36206e b4=0x352e3831 b5=0x2d302d39 b6=0x74726976 b7=0x75622820 b8=0x6f646c69 b9=0x4072657a b10=0x6c697562 b11=0x2d332d64 b12=0x782d3432 b13=0x20293638 b14=0x20636328 b15=0x706c4128 b16=0x20656e69 b17=0x322e3531 b18=0x2029302e b19=0x322e3531 b20=0x202c302e b21=0x20554e47 b22=0x2820646c b23=0x20554e47 b24=0x756e6942 b25=0x736c6974 b26=0x2e322029 b27=0x312e3534 b28=0x31232029 b29=0x706c412d b30=0x20656e69 b31=0x20504d53 b32=0x45455250 b33=0x5f54504d b34=0x414e5944 b35=0x2043494d b36=0x36323032 b37=0x2d30312d b38=0x31203732 b39=0x38353a34 b40=0xa36333a b41=0x0 b42=0x0 b43=0x0 b44=0x0 b45=0x0 b46=0x0 b47=0x0 b48=0x0 b49=0x0 b50=0x0 b51=0x0 b52=0x0 b53=0x0 b54=0x0 b55=0x0 b56=0x0 b57=0x0 b58=0x0 b59=0x0 b60=0x0 b61=0x0 b62=0x0 b63=0x0\n',
      '             cat-517     [000] .....    75.450316: sys_sendfile64 -> 0xa4\n',
      '             cat-517     [000] .....    75.450336: sys_sendfile64(out_fd: 1, in_fd: 3, offset: 0, count: 0x1000000)\n',
      '             cat-517     [000] .....    75.450406: sys_sendfile64 -> 0x0\n',
      '            bash-468     [000] ...1.    75.458255: tracing_mark_write: kf-end 0\n',
      '            bash-468     [000] ...1.    75.947757: tracing_mark_write: kf-start    11  cat /etc/hostname\n',
      '             cat-518     [000] .....    75.998343: sys_sendfile64(out_fd: 1, in_fd: 3, offset: 0, count: 0x1000000)\n',
      '             cat-518     [000] .....    76.000939: tty_0: (n_tty_write+0x0/0x4e0) nr=0xb b0=0x6e72656b b1=0x61666c65 b2=0x200a6c6c b3=0x20202020 b4=0x32322020 b5=0x36353533 b6=0xa426b20 b7=0x466d654d b8=0x3a656572 b9=0x20202020 b10=0x20202020 b11=0x39312020 b12=0x32373131 b13=0xa426b20 b14=0x416d654d b15=0x6c696176 b16=0x656c6261 b17=0x2020203a b18=0x38312020 b19=0x36353139 b20=0xa426b20 b21=0x66667542 b22=0x3a737265 b23=0x20202020 b24=0x20202020 b25=0x20202020 b26=0x30202020 b27=0xa426b20 b28=0x68636143 b29=0x203a6465 b30=0x20202020 b31=0x20202020 b32=0x20202020 b33=0x38343832 b34=0xa426b20 b35=0x70617753 b36=0x68636143 b37=0x203a6465 b38=0x20202020 b39=0x20202020 b40=0x30202020 b41=0xa426b20 b42=0x69746341 b43=0x203a6576 b44=0x20202020 b45=0x20202020 b46=0x20202020 b47=0x30343831 b48=0xa426b20 b49=0x63616e49 b50=0x65766974 b51=0x2020203a b52=0x20202020 b53=0x20202020 b54=0x34323531 b55=0xa426b20 b56=0x69746341 b57=0x61286576 b58=0x296e6f6e b59=0x2020203a b60=0x20202020 b61=0x36312020 b62=0xa426b20 b63=0x63616e49\n',
      '             cat-518     [000] .N...    76.003172: sys_sendfile64 -> 0xb\n',
      '            bash-468     [000] ...1.    76.013075: tracing_mark_write: kf-end 0\n',
    ].join('')
    const exitsOf = (command: TracedCommand | undefined) =>
      (command?.events ?? []).filter((e) => e.type === 'sys_exit' && e.name === 'sendfile64')
    const [toFile, toTerminal] = run(commandText).finished.map(exitsOf)
    const moved = (exit: LabEvent | undefined) => text(exit?.type === 'sys_exit' ? exit.data : undefined)
    expect(moved(toFile?.[0])).toBe(
      'Linux version 6.18.59-0-virt (buildozer@build-3-24-x86) (cc (Alpine 15.2.0) 15.2.0, GNU ld (GNU Binutils) 2.45.1) #1-Alpine SMP PREEMPT_DYNAMIC 2026-10-27 14:58:36\n'
    )
    expect(toFile?.[0]).not.toHaveProperty('dataCut')
    expect(toFile?.[1]).not.toHaveProperty('data')
    expect(moved(toTerminal?.[0])).toBe('kernelfall\n')
  })

  it("joins a splice's copies in order, whatever order a copy's chunks come in, up to the first one cut", () => {
    const words = (s: string) =>
      Array.from({ length: 64 }, (_, i) => {
        const bytes = [...s.slice(i * 4, i * 4 + 4)].map((c) => c.charCodeAt(0))
        return `b${i}=0x${bytes.reduce((word, byte, at) => word + byte * 256 ** at, 0).toString(16)}`
      }).join(' ')
    const copy = (chunk: number, n: number, s: string) =>
      line(450, 'cat', '8.1', `splice_${chunk}: (_copy_to_iter+0x0/0x6f0) n=${n} t=2 ${words(s)}`)
    const first = 'a'.repeat(256)
    const commandText = [
      line(434, 'bash', '8.0', 'tracing_mark_write: kf-start     3  cat /proc/a /proc/b'),
      line(450, 'cat', '8.1', 'sys_sendfile64(out_fd: 1, in_fd: 3, offset: 0, count: 0x1000000)'),
      copy(1, 300, 'b'.repeat(44)),
      copy(0, 300, first),
      copy(0, 4, 'cdef'),
      line(450, 'cat', '8.1', 'tty_0: (n_tty_write+0x0/0x4e0) nr=0x2 b0=0x6161 b1=0x0'),
      line(450, 'cat', '8.2', 'sys_sendfile64 -> 0x130'),
      line(450, 'cat', '8.3', 'sys_sendfile64(out_fd: 1, in_fd: 4, offset: 0, count: 0x1000000)'),
      copy(0, 600, first),
      copy(0, 4, 'cdef'),
      line(450, 'cat', '8.4', 'sys_sendfile64 -> 0x25c'),
      line(434, 'bash', '9.0', 'tracing_mark_write: kf-end 0'),
    ].join('')
    const exits = (run(commandText).finished[0]?.events ?? []).filter((e) => e.type === 'sys_exit')
    const data = (at: number) => {
      const exit = exits[at]
      return exit?.type === 'sys_exit' ? text(exit.data) : ''
    }
    expect(data(0)).toBe(`${first}${'b'.repeat(44)}cdef`)
    expect(exits[0]).not.toHaveProperty('dataCut')
    expect(data(1)).toBe(first)
    expect(exits[1]).toMatchObject({ ret: 604, dataCut: true })
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

  it('sends progress as changes: each update from the first event changed since the last one', () => {
    const { finished, progress } = run(SESSION, 37)
    let known: readonly LabEvent[] = []
    let carried = 0
    for (const update of progress) {
      known = spliceEvents(known, update.from ?? 0, update.events) ?? []
      carried += update.events.length
    }
    const events = finished[0]?.events ?? []
    expect(known.slice(0, events.length)).toEqual(events)
    // The probes complete a call's entry after it is sent, so a little is resent, never the whole run each time.
    expect(carried).toBeLessThan(known.length * 2)
    expect(progress.some((update) => (update.from ?? 0) > 0)).toBe(true)
  })

  it('merges updates waiting to be sent into one that runs to the end', () => {
    const { finished, progress } = run(SESSION, 37)
    const merged = progress.reduce<TracedCommand | null>((pending, next) => mergeProgress(pending, next), null)
    const events = finished[0]?.events ?? []
    expect(merged?.from).toBe(0)
    expect(merged?.events.slice(0, events.length)).toEqual(events)
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

  it("drops PROMPT_COMMAND's redirection to the end marker, after the command's own output", () => {
    const pwd = [
      line(434, 'bash', '7.0000', 'sys_write(fd: 9, buf: 0xbf9486a0, count: 0x20)'),
      line(434, 'bash', '7.0001', 'tracing_mark_write: kf-start    10  pwd'),
      line(434, 'bash', '7.0002', 'sys_write -> 0x20'),
      line(434, 'bash', '7.0003', 'sys_writev(fd: 1, vec: 0xbf9486a0, vlen: 1)'),
      line(434, 'bash', '7.0004', 'sys_writev -> 0xa'),
      line(434, 'bash', '7.0005', 'sys_rt_sigprocmask(how: 0x0, nset: 0x0, oset: 0xbf96bcec, sigsetsize: 0x8)'),
      line(434, 'bash', '7.0006', 'sys_rt_sigprocmask -> 0x0'),
      line(434, 'bash', '7.0007', 'sys_fcntl64(fd: 0x1, cmd: 0x1, arg: 0x0)'),
      line(434, 'bash', '7.0008', 'sys_fcntl64 -> 0x0'),
      line(434, 'bash', '7.0009', 'sys_fcntl64(fd: 0x1, cmd: 0x0, arg: 0xa)'),
      line(434, 'bash', '7.0010', 'sys_fcntl64 -> 0xa'),
      line(434, 'bash', '7.0011', 'sys_fcntl64(fd: 0x1, cmd: 0x1, arg: 0x0)'),
      line(434, 'bash', '7.0012', 'sys_fcntl64 -> 0x0'),
      line(434, 'bash', '7.0013', 'sys_fcntl64(fd: 0xa, cmd: 0x2, arg: 0x1)'),
      line(434, 'bash', '7.0014', 'sys_fcntl64 -> 0x0'),
      line(434, 'bash', '7.0015', 'sys_dup2(oldfd: 0x9, newfd: 0x1)'),
      line(434, 'bash', '7.0016', 'sys_dup2 -> 0x1'),
      line(434, 'bash', '7.0017', 'sys_fcntl64(fd: 0x9, cmd: 0x1, arg: 0x0)'),
      line(434, 'bash', '7.0018', 'sys_fcntl64 -> 0x1'),
      line(434, 'bash', '7.0019', 'sys_write(fd: 1, buf: 0xbf9486a0, count: 0x9)'),
      line(434, 'bash', '7.0020', 'tracing_mark_write: kf-end 0'),
      line(434, 'bash', '7.0021', 'sys_write -> 0x9'),
    ].join('')
    const { finished } = run(pwd)
    const calls = (finished[0]?.events ?? []).flatMap((e) => (e.type === 'sys_enter' ? [e.name] : []))
    expect(calls).toEqual(['writev'])
  })

  it("keeps a builtin's own dup2 at the end when it isn't the redirection to the marker", () => {
    const fcntl = [
      line(434, 'bash', '8.0000', 'sys_write(fd: 9, buf: 0xbf9486a0, count: 0x20)'),
      line(434, 'bash', '8.0001', 'tracing_mark_write: kf-start    11  cd /tmp; exec 3>&1'),
      line(434, 'bash', '8.0002', 'sys_write -> 0x20'),
      line(434, 'bash', '8.0003', 'sys_chdir(filename: 0x4b8b00)'),
      line(434, 'bash', '8.0004', 'sys_chdir -> 0x0'),
      line(434, 'bash', '8.0005', 'sys_dup2(oldfd: 0x1, newfd: 0x3)'),
      line(434, 'bash', '8.0006', 'sys_dup2 -> 0x3'),
      line(434, 'bash', '8.0007', 'sys_write(fd: 9, buf: 0xbf9486a0, count: 0x9)'),
      line(434, 'bash', '8.0008', 'tracing_mark_write: kf-end 0'),
      line(434, 'bash', '8.0009', 'sys_write -> 0x9'),
    ].join('')
    const calls = (run(fcntl).finished[0]?.events ?? []).flatMap((e) => (e.type === 'sys_enter' ? [e.name] : []))
    expect(calls).toEqual(['chdir', 'dup2'])
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
