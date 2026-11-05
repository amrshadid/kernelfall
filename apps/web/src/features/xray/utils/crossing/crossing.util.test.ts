import type { CrossingStoryboard, XrayCall } from '@features/xray/types'
import { toXrayCalls } from '@features/xray/utils/calls'
import { filesOf, routesOf } from '@features/xray/utils/route'
import { unfilledPlaceholders, xrayContent } from '@kernelfall/levels/utils'
import type { CallRoute } from '@kernelfall/machine/types'
import { describe, expect, it } from 'vitest'
import { recordedCommand } from '@/test/fixtures/recorded-runs.fixture'
import { bytes, type EventInit, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { NO_BREAK } from './crossing.constants'
import { crossingParts, crossingStoryboard, requestText } from './crossing.util'
import { sayKeyOf } from './crossing-calls.util'

/** No-break spaces shown as ~, so the tests can see where the card may not wrap. */
const marked = (text: string) => text.replaceAll(NO_BREAK, '~')

const content = xrayContent()
// P.3's recording runs the same BusyBox /bin/echo the P.2 chip does.
const P1 = 'prologue-boot-path-01-power-on'
const P2 = 'prologue-boot-path-02-first-words'
const P3 = 'prologue-boot-path-03-speak-to-shell'
const P4 = 'prologue-boot-path-04-the-boot-path'
const P5 = 'prologue-machine-in-section-05-kernel-up-close'
const P6 = 'prologue-machine-in-section-06-finding-the-hardware'
const P7 = 'prologue-machine-in-section-07-who-runs'
const S1 = 'prologue-surface-survey-01-streets'
const S2 = 'prologue-surface-survey-02-who-may-enter'
const S3 = 'prologue-surface-survey-03-processes'
const S4 = 'prologue-surface-survey-04-finding-things'
const ECHO = '/bin/echo one two three four'
const GCC = 'gcc -Wall -Wextra hello.c -o hello && ./hello'
const CMDLINE = 'cat /proc/cmdline'
const NEAR = 'cat /etc/mo*'
const MAN = 'MANPAGER=cat man ls'
const DMESG = 'dmesg | grep -i "command line"'
const YES = 'yes > /dev/null & yes > /dev/null & yes > /dev/null & sleep 4; top -b -n 1 | head -12; kill %1 %2 %3'

async function recordedCalls(level: string, run: string, commandLine: string): Promise<readonly XrayCall[]> {
  const { events } = await recordedCommand(level, run, commandLine)
  return toXrayCalls(runOf(events, commandLine), events, content)
}

async function recordedBoard(
  level: string,
  run: string,
  commandLine: string,
  pick: (call: XrayCall) => boolean
): Promise<CrossingStoryboard> {
  const { events } = await recordedCommand(level, run, commandLine)
  const calls = toXrayCalls(runOf(events, commandLine), events, content)
  const call = calls.find(pick)
  if (!call) {
    throw new Error(`${level}/${run}: no such call`)
  }
  // As the board hook does: the route each sys_exit carried, and the file each fd was opened on.
  return crossingStoryboard(call, content.narration, {
    route: routesOf(events).get(call.id),
    file: filesOf(calls).get(call.id),
  })
}

async function recordedCall(level: string, run: string, commandLine: string, pick: (call: XrayCall) => boolean) {
  return (await recordedBoard(level, run, commandLine, pick)).call
}

const echoCall = (name: string) => recordedCall(P3, 'solution', ECHO, (c) => c.program === 'echo' && c.name === name)

const errnoOf = (call: XrayCall) => (call.outcome.kind === 'returned' ? call.outcome.errno : null)
const named =
  (name: string, errno: string | null = null) =>
  (c: XrayCall) =>
    c.name === name && errnoOf(c) === errno
const withPath = (name: string, path: string) => (c: XrayCall) => c.name === name && c.path === path

/** What the crossing shows for one call: the card's request, the kernel beat, the device, the answer, the guess. */
function shown(board: CrossingStoryboard) {
  return {
    request: marked(board.request),
    kernel: board.stages.find((s) => s.scene.beat === 'kernel')?.what,
    device: board.terminal,
    answer: `${board.answer.value} / ${board.answer.meaning}`,
    predict: board.stages.find((s) => s.predict)?.predict?.options ?? null,
  }
}

describe('crossingStoryboard on the write P.2 teaches', () => {
  it('crosses in five beats: ask, the Gate, the kernel, the terminal, the answer', async () => {
    const board = crossingStoryboard(await echoCall('write'), content.narration)
    expect(board.stages.map((s) => s.tick)).toEqual(['ask', 'the Gate', 'kernel', 'terminal', 'answer'])
    expect(board.stages.map((s) => s.scene.beat)).toEqual(['ask', 'gate', 'kernel', 'device', 'answer'])
  })

  it('says each beat in one plain sentence, with the real numbers', async () => {
    const board = crossingStoryboard(await echoCall('write'), content.narration)
    expect(board.stages.map((s) => s.what)).toEqual([
      "`echo` can't touch your terminal itself, so it asks the kernel: write 19 bytes to fd 1.",
      "The request crosses the Gate: the CPU switches to kernel mode, where only the kernel's code runs.",
      'The kernel finds that fd 1 is your terminal and hands the 19 bytes to its driver, the tty driver.',
      'The bytes reach the terminal: `one two three four` appears on the screen.',
      'The answer comes back up through the Gate: 19, all 19 bytes taken.',
    ])
    expect(board.stages[0]?.title).toBe('echo asks the kernel')
  })

  it('keeps the entry path, registers and pt_regs for Deep', async () => {
    const board = crossingStoryboard(await echoCall('write'), content.narration)
    const said = board.stages.map((s) => `${s.title} ${s.what}`).join(' ')
    for (const deep of ['eax', 'int $0x80', 'pt_regs', 'iret', 'register', 'ring', 'entry_INT80_32']) {
      expect(said).not.toContain(deep)
    }
  })

  it('carries the request in plain words and lights the tty driver, under the VFS', async () => {
    const call = await echoCall('write')
    expect(marked(requestText(call))).toBe('write 19~bytes to fd~1 (your terminal)')
    expect(crossingParts(call)).toEqual([
      { id: 'vfs', name: 'VFS and filesystems', detail: 'fs/', served: false },
      { id: 'drivers', name: 'Devices and drivers', detail: 'tty driver', served: true },
    ])
    const board = crossingStoryboard(call, content.narration)
    expect(board.terminal).toBe('one two three four\n')
    expect(board.answer).toEqual({ value: '19', meaning: 'all 19 bytes taken' })
  })

  it('pauses for a guess only before the answer, with choices from the call', async () => {
    const board = crossingStoryboard(await echoCall('write'), content.narration)
    expect(board.stages.filter((s) => s.predict).map((s) => s.key)).toEqual(['answer'])
    expect(board.stages.at(-1)?.predict).toMatchObject({
      question: 'What will the kernel answer?',
      options: ['-1', '0', '1', '19'],
      answer: '19',
    })
  })
})

describe('crossingStoryboard on every kind of call The Surface makes, as the Machine recorded it', () => {
  it('open: the path walk and the new fd, the lowest free', async () => {
    const board = await recordedBoard(P1, 'other-paths', CMDLINE, withPath('open', '/proc/cmdline'))
    expect(shown(board)).toEqual({
      request: 'open a file for reading',
      kernel:
        'The VFS walks `/proc/cmdline` one folder at a time, checking your permission at each step, and gives this process fd 3: the lowest number free in its table. The file is on procfs, whose files the kernel writes out from its own state as you read them.',
      device: null,
      answer: '3 / the new fd',
      predict: ['-1', '0', '3'],
    })
  })

  it('open refused: the permission bits, in the security part', async () => {
    const board = await recordedBoard(S2, 'solution', 'cat box/notes.txt', named('open', 'EACCES'))
    expect(shown(board)).toMatchObject({
      kernel: 'The kernel tries, and stops: the permission bits say no: you may not open `box/notes.txt` for reading.',
      answer: '-1 / EACCES',
      predict: ['-1', '0'],
    })
    expect(board.parts.find((p) => p.served)?.id).toBe('security')
  })

  it('read: a folder is refused with EISDIR', async () => {
    const board = await recordedBoard(P3, 'near-misses', NEAR, named('read', 'EISDIR'))
    expect(shown(board)).toEqual({
      request: 'read up to 65536~bytes from fd~3',
      kernel: "The kernel tries, and stops: fd 3 is a folder, and read() doesn't read folders.",
      device: null,
      answer: '-1 / EISDIR',
      predict: ['-1', '0', '65536'],
    })
  })

  it('read: 0 is the end of the file', async () => {
    const board = await recordedBoard(P1, 'other-paths', CMDLINE, (c) => c.name === 'read' && c.program === 'bash')
    expect(shown(board)).toMatchObject({ request: 'read up to 1~byte from fd~3', answer: '0 / end of file' })
  })

  it('sendfile64: the kernel copies file to terminal itself, and the screen shows it', async () => {
    const board = await recordedBoard(P1, 'other-paths', CMDLINE, (c) => c.name === 'sendfile64' && c.console !== null)
    expect(shown(board)).toMatchObject({
      request: 'copy fd~3 to fd~1',
      kernel:
        "The kernel reads from fd 3 and hands the bytes to fd 1, your terminal, through the tty driver: they never pass through `cat`'s memory. The file it reads from is on procfs, whose files the kernel writes out from its own state as you read them.",
      answer: '89 / 89 bytes copied',
      predict: ['-1', '0', '89'],
    })
    expect(board.terminal).toMatch(/^console=ttyS0 /)
    expect(board.stages[0]?.what).toBe('`cat` asks the kernel to copy fd 3 into fd 1 inside the kernel, up to 16 MiB.')
    expect(board.call.text).toContain('0x1000000')
    expect(board.stages.map((s) => s.scene.beat)).toContain('device')
  })

  it('sendfile64 refused: nothing moved', async () => {
    const board = await recordedBoard(P3, 'near-misses', NEAR, named('sendfile64', 'EINVAL'))
    expect(shown(board).kernel).toBe(
      "The kernel tries, and stops: these two files can't be copied this way, so nothing moved."
    )
  })

  it('writev: buffers in order to the terminal, its colour codes not shown', async () => {
    const board = await recordedBoard(P1, 'solution', 'ls /', (c) => c.name === 'writev' && c.console !== null)
    expect(shown(board)).toMatchObject({
      request: 'write 2~buffers to fd~1 (your terminal)',
      kernel:
        'The kernel finds that fd 1 is your terminal and hands the 2 buffers, in order, to its driver, the tty driver.',
      answer: '150 / 150 bytes taken',
    })
    expect(board.terminal).not.toContain('\x1b')
    expect(board.terminal).toMatch(/^bin +dev/)
  })

  it('writev refused: no reader is left on the pipe', async () => {
    const board = await recordedBoard(P4, 'kept-quiet', 'dmesg | grep -m 4 "calling  "', named('writev', 'EPIPE'))
    expect(shown(board).kernel).toBe(
      'The kernel tries, and stops: nothing reads the other end any more, so the kernel also sends `dmesg` SIGPIPE.'
    )
  })

  it('close, and close refused: fd 4 is not open', async () => {
    const ok = await recordedBoard(P1, 'other-paths', CMDLINE, named('close'))
    expect(shown(ok)).toMatchObject({ request: 'close fd~3', answer: '0 / fd 3 is closed', predict: null })
    const bad = await recordedBoard(P4, 'kept-quiet', DMESG, named('close', 'EBADF'))
    expect(shown(bad).kernel).toBe("The kernel tries, and stops: fd 4 isn't open.")
  })

  it('statx: a name that does not exist, without naming a filesystem', async () => {
    const board = await recordedBoard(P1, 'other-paths', CMDLINE, withPath('statx', '/home/you/.terminfo'))
    expect(shown(board)).toEqual({
      request: 'the details of this file',
      kernel: "The kernel tries, and stops: a name in `/home/you/.terminfo` doesn't exist.",
      device: null,
      answer: '-1 / ENOENT',
      predict: ['-1', '0'],
    })
    expect(board.parts).toEqual([{ id: 'vfs', name: 'VFS and filesystems', detail: 'fs/stat.c', served: true }])
    expect(board.stages.at(-1)?.what).toBe(
      'The answer comes back up: an error. The C library hands `bash` -1 and sets `errno` to `ENOENT`: no such file or directory.'
    )
  })

  it('getdents64: the folder entries, by bytes', async () => {
    const board = await recordedBoard(
      P1,
      'solution',
      'ls /',
      (c) => c.name === 'getdents64' && c.outcome.kind === 'returned' && c.outcome.ret > 0
    )
    expect(shown(board)).toEqual({
      request: 'list the folder at fd~3',
      kernel:
        "The VFS copies the folder's next entries into `ls`'s buffer, up to 2048 bytes: each one a name, an inode number and a type. The folder is on 9p, the Machine's root filesystem: its files live outside the VM and come in over virtio.",
      device: null,
      answer: '488 / 488 bytes of entries',
      predict: ['-1', '0', '488'],
    })
  })

  it('execve: the same PID, a new program, and no answer to guess', async () => {
    const board = await recordedBoard(P3, 'solution', ECHO, withPath('execve', '/bin/echo'))
    expect(shown(board)).toMatchObject({
      request: 'run this program',
      answer: 'none / now runs echo',
      predict: null,
    })
    expect(shown(board).kernel).toMatch(
      /^The kernel opens `\/bin\/echo`, checks you may run it, throws away this process's memory and loads the new program into it\. The PID stays \d+\.$/
    )
    expect(board.stages.at(-1)?.what).toBe('No answer comes back to the old program: this process now runs `echo`.')
    expect(board.parts.find((p) => p.served)?.id).toBe('processes')
  })

  it('execve refused: a file that may not run', async () => {
    const board = await recordedBoard(S2, 'not-hi', './notes.txt', named('execve', 'EACCES'))
    expect(shown(board).kernel).toBe('The kernel tries, and stops: you may not run `./notes.txt`.')
  })

  it("fork and wait4: the child's PID, then collecting it", async () => {
    const fork = await recordedBoard(P1, 'other-paths', CMDLINE, named('fork'))
    const child = fork.answer.value
    expect(shown(fork)).toMatchObject({
      request: 'make a copy of this process',
      answer: `${child} / the new child's PID`,
    })
    expect(shown(fork).kernel).toBe(
      `The kernel makes PID ${child}, a copy of this process: the same program, memory and open files. The memory is shared until either one writes to it.`
    )
    const wait = await recordedBoard(P1, 'other-paths', CMDLINE, (c) => c.name === 'wait4' && errnoOf(c) === null)
    expect(shown(wait)).toMatchObject({
      request: 'wait for a child',
      answer: `${child} / the child's PID`,
      predict: ['-1', '0', child],
    })
    expect(shown(wait).kernel).toBe(
      'The kernel checks whether a child has ended or stopped; if not yet, it puts `bash` to sleep until then. For a child that ended, it hands over the exit status and frees what was left of it, the zombie.'
    )
  })

  it('wait4 without waiting: none yet, or no child at all', async () => {
    const none = await recordedBoard(
      P7,
      'solution',
      YES,
      (c) => c.name === 'wait4' && c.outcome.kind === 'returned' && c.outcome.ret === 0
    )
    expect(shown(none)).toMatchObject({ request: 'check on a child, no waiting', answer: '0 / none has yet' })
    const nochild = await recordedBoard(P1, 'other-paths', CMDLINE, named('wait4', 'ECHILD'))
    expect(shown(nochild).kernel).toBe(
      'The kernel tries, and stops: `bash` has no child that matches, so there is nothing to wait for.'
    )
  })

  it('clone with CLONE_VM and CLONE_VFORK: the child borrows the memory', async () => {
    const board = await recordedBoard(P2, 'broken', GCC, (c) => c.name === 'clone' && errnoOf(c) === null)
    expect(sayKeyOf(board.call)).toBe('clone-vfork')
    expect(shown(board).kernel).toMatch(
      /^The kernel makes PID \d+, which shares this process's memory instead of copying it, and holds `gcc` until the child runs a new program or exits\.$/
    )
  })

  it('exit_group: the status kept for the parent, no answer', async () => {
    const board = crossingStoryboard(await echoCall('exit_group'), content.narration)
    expect(board.stages.map((s) => s.scene.beat)).toEqual(['ask', 'gate', 'kernel', 'answer'])
    expect(shown(board)).toEqual({
      request: 'end this process, status~0',
      kernel:
        'The kernel stops every thread of this process, closes its files and frees its memory. It keeps only the exit status, 0, for the parent to collect.',
      device: null,
      answer: 'none / the process is gone',
      predict: null,
    })
  })

  it('chdir and getppid as man runs, and nanosleep as sleep does', async () => {
    const chdir = await recordedBoard(P3, 'solution', MAN, withPath('chdir', '/usr/share/man'))
    expect(shown(chdir)).toMatchObject({
      request: 'move into this folder',
      kernel:
        "The VFS finds the folder `/usr/share/man`, checks you may enter it, and makes it this process's working directory.",
      answer: '0 / now in that folder',
    })
    const ppid = await recordedBoard(P3, 'solution', MAN, named('getppid'))
    const parent = ppid.answer.value
    expect(Number(parent)).not.toBe(ppid.call.pid)
    expect(shown(ppid).answer).toBe(`${parent} / the parent's PID`)
    expect(shown(ppid).predict).toEqual(['1', parent, String(ppid.call.pid)])
    const sleep = await recordedBoard(P7, 'solution', YES, (c) => c.program === 'sleep' && c.name.includes('sleep'))
    expect(shown(sleep)).toMatchObject({
      request: 'sleep for a set time',
      answer: '0 / the time has passed',
      predict: null,
    })
  })

  it('mkdir, and mkdir refused: the folder exists', async () => {
    const mkdirs = 'mkdir -p /tmp/survey/maps /tmp/survey/notes'
    const ok = await recordedBoard(S1, 'copy-not-rename', mkdirs, withPath('mkdir', '/tmp/survey/maps'))
    expect(shown(ok)).toMatchObject({ request: 'make this folder', answer: '0 / the folder is made' })
    const exists = await recordedBoard(S1, 'copy-not-rename', mkdirs, withPath('mkdir', '/tmp/'))
    expect(shown(exists).kernel).toBe('The kernel tries, and stops: `/tmp/` already exists.')
  })

  it('rename moves a name, never the bytes', async () => {
    const board = await recordedBoard(S1, 'solution', 'mv motd motd.old', named('rename'))
    expect(shown(board).kernel).toBe(
      "The VFS moves the name `motd` to its new place. Only names change: the file's bytes stay where they are."
    )
  })

  it('rmdir, and rmdir refused: the folder is not empty', async () => {
    const ok = await recordedBoard(S1, 'solution', 'rmdir ../notes/old', named('rmdir'))
    expect(shown(ok)).toMatchObject({ request: 'remove this empty folder', answer: '0 / the folder is gone' })
    const full = await recordedBoard(S1, 'solution', 'rmdir ../notes', named('rmdir', 'ENOTEMPTY'))
    expect(shown(full)).toMatchObject({
      kernel: "The kernel tries, and stops: `../notes` isn't empty, and rmdir removes only empty folders.",
      answer: '-1 / ENOTEMPTY',
      predict: ['-1', '0'],
    })
  })

  it('unlink removes a name; the file goes when nothing uses it', async () => {
    const board = await recordedBoard(P2, 'broken', GCC, named('unlink'))
    expect(shown(board).kernel).toMatch(
      /^The VFS takes the name `\/tmp\/[^`]+` out of its folder\. The file itself goes once no other name and no open file uses it\.$/
    )
  })

  it('chmod, and chmod refused: only the owner may', async () => {
    const ok = await recordedBoard(P2, 'solution-printf', GCC, named('chmod'))
    expect(shown(ok)).toMatchObject({ request: 'set mode~0755 on this', answer: '0 / the mode is set' })
    const refused = await recordedBoard(S2, 'solution', 'chmod 666 /etc/motd', named('chmod', 'EPERM'))
    expect(shown(refused)).toMatchObject({
      request: 'set mode~0666 on this',
      kernel:
        "The kernel tries, and stops: only the owner of `/etc/motd`, or root, may change its permission bits, and you aren't its owner.",
    })
    expect(refused.parts.find((p) => p.served)?.id).toBe('security')
  })

  it('kill: a process group, and PID 1 refused', async () => {
    const group = await recordedBoard(P7, 'solution', YES, named('kill'))
    expect(shown(group).request).toMatch(/^send SIGTERM to group~\d+$/)
    expect(shown(group).kernel).toMatch(
      /^The kernel checks you may signal every process in group \d+, then marks SIGTERM pending there; it takes effect when the receiver next runs\.$/
    )
    const init = await recordedBoard(S3, 'solution', 'kill 1', named('kill', 'EPERM'))
    expect(shown(init)).toMatchObject({
      request: 'send SIGTERM to PID~1',
      kernel:
        "The kernel tries, and stops: you may signal only your own user's processes (unless you are root), and PID 1 isn't one.",
    })
  })

  it('pipe, dup2, getpid and uname', async () => {
    const pipe = await recordedBoard(P1, 'other-paths', CMDLINE, named('pipe'))
    expect(shown(pipe)).toMatchObject({ request: 'make a pipe', answer: '0 / two new fds', predict: null })
    expect(pipe.parts.find((p) => p.served)?.id).toBe('ipc')
    const dup2 = await recordedBoard(P3, 'near-misses', '/usr/local/bin/hello', named('dup2'))
    const old = dup2.call.args[0]?.value ?? ''
    expect(shown(dup2)).toMatchObject({
      request: `make fd~1 a copy of fd~${old}`,
      answer: '1 / fd 1 shares it now',
      predict: ['-1', '0', '1', old],
    })
    const getpid = await recordedBoard(P1, 'other-paths', CMDLINE, named('getpid'))
    const pid = String(getpid.call.pid)
    expect(shown(getpid)).toMatchObject({ answer: `${pid} / this process's PID`, predict: ['0', '1', pid] })
    const uname = await recordedBoard(P5, 'solution', './myuname', named('uname'))
    expect(shown(uname)).toMatchObject({
      kernel:
        "The kernel copies its name (Linux), its release, version and machine type, and this Machine's hostname, into `myuname`'s buffer.",
      answer: '0 / the names are copied',
    })
  })

  it("syslog: the log buffer's size, then a copy of the log", async () => {
    const size = await recordedBoard(P4, 'kept-quiet', DMESG, (c) => c.name === 'syslog' && c.args[0]?.value === '10')
    expect(shown(size)).toMatchObject({ request: "the kernel log's size", answer: '131072 / its size, in bytes' })
    const read = await recordedBoard(P4, 'kept-quiet', DMESG, (c) => c.name === 'syslog' && c.args[0]?.value === '3')
    expect(shown(read).kernel).toBe(
      "The kernel copies the messages in its log buffer, oldest first, into `dmesg`'s buffer, and leaves the log as it was."
    )
    expect(read.parts.find((p) => p.served)?.id).toBe('logging')
  })

  it('readlink: the link target, by bytes, and refused for another user', async () => {
    const ok = await recordedBoard(P6, 'solution', 'lspci -k', named('readlink'))
    expect(shown(ok)).toMatchObject({ request: 'where this link points', answer: '35 / a 35-byte path' })
    expect(ok.stages[0]?.what).toBe(
      '`lspci` asks the kernel where the symbolic link `/sys/bus/pci/devices/0000:00:06.0/driver` points.'
    )
    const notLink = await recordedBoard(P6, 'solution', 'lspci -k', named('readlink', 'EINVAL'))
    expect(shown(notLink).kernel).toBe("The kernel tries, and stops: `/sys` isn't a symbolic link.")
    const denied = await recordedBoard(S3, 'kill-without-stop', 'kill $(pidof yes)', named('readlink', 'EACCES'))
    expect(shown(denied).kernel).toBe(
      "The kernel tries, and stops: you aren't allowed to read where `/proc/1/exe` points."
    )
  })

  it('leaves no placeholder unfilled for any call of these runs', async () => {
    const runs: [string, string, string][] = [
      [P1, 'other-paths', CMDLINE],
      [P1, 'solution', 'ls /'],
      [P2, 'broken', GCC],
      [P3, 'near-misses', NEAR],
      [P3, 'solution', MAN],
      [P4, 'kept-quiet', DMESG],
      [P7, 'solution', YES],
      [S1, 'solution', 'mv motd motd.old'],
      [S2, 'solution', 'chmod 666 /etc/motd'],
      [S3, 'solution', 'kill 1'],
    ]
    for (const [level, run, commandLine] of runs) {
      for (const call of await recordedCalls(level, run, commandLine)) {
        const board = crossingStoryboard(call, content.narration)
        const texts = [
          board.request,
          board.answer.meaning,
          ...board.stages.flatMap((s) => [s.title, s.what, s.predict?.explain ?? '']),
        ]
        expect(texts.flatMap(unfilledPlaceholders), `${level} ${call.text}`).toEqual([])
      }
    }
  })

  it('a call X-ray has no words for is only "the kernel", in its content\'s words', async () => {
    const call = await echoCall('set_tid_address')
    expect(sayKeyOf(call)).toBeNull()
    expect(crossingParts(call)).toEqual([
      { id: null, name: 'The kernel', detail: call.kernelPath.at(-1), served: true },
    ])
    const board = crossingStoryboard(call, content.narration)
    expect(board.request).toBe(call.desk)
    expect(board.stages[2]?.what).toMatch(/^The kernel does the work: it /)
  })
})

describe('crossingStoryboard on recorded calls that carry a route', () => {
  const kernel = (board: CrossingStoryboard) => board.stages.find((s) => s.scene.beat === 'kernel')?.what ?? ''
  const served = (board: CrossingStoryboard) => board.parts.find((p) => p.served)?.detail

  it("P.2's write: the tty driver, said once, and the screen", async () => {
    const board = await recordedBoard(P3, 'solution', ECHO, (c) => c.program === 'echo' && c.name === 'write')
    expect(kernel(board)).toBe(
      'The kernel finds that fd 1 is your terminal and hands the 19 bytes to its driver, the tty driver.'
    )
    expect(served(board)).toBe('tty driver')
  })

  it.each([
    [
      P1,
      'other-paths',
      'cat /etc/hostname',
      named('sendfile64'),
      '9p',
      "The file it reads from is on 9p, the Machine's root filesystem",
    ],
    [P1, 'other-paths', CMDLINE, named('sendfile64'), 'procfs', 'The file it reads from is on procfs'],
    [
      P7,
      'solution',
      'cat /proc/$$/status',
      (c: XrayCall) => c.program === 'cat' && c.name === 'read',
      'procfs',
      'The file is on procfs',
    ],
    [P6, 'solution', 'lspci -k', named('getdents64'), 'sysfs', 'The folder is on sysfs'],
    [S1, 'copy-not-rename', 'ls -R /tmp/survey', named('getdents64'), 'tmpfs', 'The folder is on tmpfs'],
    [P1, 'solution', 'ls /', withPath('statx', '/dev'), 'devtmpfs', 'The file is on devtmpfs'],
    [P4, 'kept-quiet', DMESG, named('writev'), 'pipefs', 'The file is a pipe'],
    [
      S4,
      'solution',
      'find / -name passwd 2>/dev/null',
      named('write'),
      'mem driver',
      'It is /dev/null, which throws the bytes away',
    ],
  ])('%s %s `%s`: names %s', async (level, run, commandLine, pick, detail, sentence) => {
    const board = await recordedBoard(level, run, commandLine, pick)
    expect(kernel(board)).toContain(sentence)
    expect(served(board)).toBe(detail)
  })
})

// Synthetic calls carrying the route the Machine's trace adds to each sys_exit.
const fsRoute = (fs: string, fn: string) => ({ kind: 'fs', fs, fn }) as CallRoute
const driverRoute = (driver: string, fn: string): CallRoute => ({ kind: 'driver', driver, fn })

function routedBoard(inits: readonly EventInit[], name: string): CrossingStoryboard {
  const events = stamp(inits)
  const calls = toXrayCalls(runOf(events, './probe'), events, content)
  const call = calls.find((c) => c.name === name)
  if (!call) {
    throw new Error(`no ${name}`)
  }
  return crossingStoryboard(call, content.narration, {
    route: routesOf(events).get(call.id),
    file: filesOf(calls).get(call.id),
  })
}

const readWith = (route?: CallRoute) =>
  routedBoard(
    [
      { type: 'sys_enter', pid: 2, nr: 3, name: 'read', args: [3, 0x5000, 64] },
      { type: 'sys_exit', pid: 2, nr: 3, name: 'read', ret: 12, ...(route && { route }) },
    ],
    'read'
  )

const writeWith = (route: CallRoute, console = false) =>
  routedBoard(
    [
      { type: 'sys_enter', pid: 2, nr: 4, name: 'write', args: [1, 0x5000, 3], data: bytes('hi\n') },
      ...(console ? [{ type: 'console_write', bytes: bytes('hi\n') } as const] : []),
      { type: 'sys_exit', pid: 2, nr: 4, name: 'write', ret: 3, route },
    ],
    'write'
  )

const kernelOf = (board: CrossingStoryboard) => board.stages.find((s) => s.scene.beat === 'kernel')?.what ?? ''
const servedOf = (board: CrossingStoryboard) => board.parts.find((p) => p.served)

describe('crossingStoryboard with the route the trace names', () => {
  const READ = "The kernel finds the open file behind fd 3 and copies up to 64 bytes from it into `probe`'s buffer."

  it.each([
    [
      '9p',
      'v9fs_file_read_iter',
      '9p',
      "on 9p, the Machine's root filesystem: its files live outside the VM and come in over virtio",
    ],
    [
      'proc',
      'proc_reg_read_iter',
      'procfs',
      'on procfs, whose files the kernel writes out from its own state as you read them',
    ],
    [
      'sysfs',
      'kernfs_fop_read_iter',
      'sysfs',
      "on sysfs, where each file is one attribute of a device or driver, written out by the kernel when it's read",
    ],
    ['tmpfs', 'shmem_file_read_iter', 'tmpfs', 'on tmpfs, which keeps its files in memory'],
    ['devtmpfs', 'shmem_file_read_iter', 'devtmpfs', 'on devtmpfs, where the kernel keeps the device files of /dev'],
    ['tracefs', 'tracing_read_pipe', 'tracefs', "on tracefs, the kernel's tracing controls and output"],
    ['pipefs', 'pipe_read', 'pipefs', 'a pipe: its bytes wait in a buffer inside the kernel until a reader takes them'],
  ])('a read served by %s names it, in the drawing and the sentence', (fs, fn, detail, on) => {
    const board = readWith(fsRoute(fs, fn))
    expect(kernelOf(board)).toBe(`${READ} The file is ${on}.`)
    expect(servedOf(board)?.detail).toBe(detail)
  })

  it('a read on ext4 says the page cache serves it', () => {
    const board = readWith(fsRoute('ext4', 'ext4_file_read_iter'))
    expect(kernelOf(board)).toBe(
      `${READ} The file is on ext4, the filesystem on the Machine's IDE disk. ext4 serves the bytes from the page cache, the kernel's copy of the disk in memory; on a miss, it reads the disk first.`
    )
    expect(board.parts.map((p) => p.id)).toEqual(['vfs'])
  })

  it('a write on ext4 reaches the page cache, not the disk, and no device beat', () => {
    const board = writeWith(fsRoute('ext4', 'ext4_file_write_iter'))
    expect(kernelOf(board)).toContain('ext4 puts the bytes in the page cache; the disk gets them later, at writeback.')
    expect(board.terminal).toBeNull()
  })

  it('a write to /dev/null: the mem driver throws the bytes away', () => {
    const board = writeWith(driverRoute('mem', 'write_null'))
    expect(kernelOf(board)).toBe(
      "The kernel finds the open file behind fd 1 and copies the 3 bytes from `probe`'s buffer into it. It is /dev/null, which throws the bytes away and reports them all written."
    )
    expect(servedOf(board)).toMatchObject({ id: 'drivers', detail: 'mem driver' })
  })

  it('a write to the terminal names the tty driver once, and the screen shows it', () => {
    const board = writeWith(driverRoute('tty', 'tty_write'), true)
    expect(kernelOf(board)).toBe(
      'The kernel finds that fd 1 is your terminal and hands the 3 bytes to its driver, the tty driver.'
    )
    expect(board.terminal).toBe('hi\n')
    expect(servedOf(board)).toMatchObject({ id: 'drivers', detail: 'tty driver' })
  })

  it('a driver X-ray has no words for is named by the trace', () => {
    const board = readWith(driverRoute('random', 'urandom_read_iter'))
    expect(kernelOf(board)).toContain('/dev/random or /dev/urandom, so the random driver hands out bytes')
    expect(kernelOf(readWith(driverRoute('rtc', 'rtc_dev_read')))).toContain(
      'a device, so its driver, rtc, does the work'
    )
  })

  it('statx on devpts names the filesystem that holds the terminal', () => {
    const board = routedBoard(
      [
        {
          type: 'sys_enter',
          pid: 2,
          nr: 383,
          name: 'statx',
          args: [-100, 0x5000, 0, 0x7ff, 0x6000],
          data: bytes('/dev/pts/0'),
        },
        { type: 'sys_exit', pid: 2, nr: 383, name: 'statx', ret: 0, route: fsRoute('devpts', 'generic_fillattr') },
      ],
      'statx'
    )
    expect(kernelOf(board)).toBe(
      "The VFS finds `/dev/pts/0` and copies its details into `probe`'s buffer. The file is on devpts, which holds the terminals under /dev/pts."
    )
  })

  it('sendfile64 names the filesystem it reads from', () => {
    const board = routedBoard(
      [
        { type: 'sys_enter', pid: 2, nr: 239, name: 'sendfile64', args: [1, 3, 0, 0x1000000] },
        { type: 'sys_exit', pid: 2, nr: 239, name: 'sendfile64', ret: 89, route: fsRoute('proc', 'copy_splice_read') },
      ],
      'sendfile64'
    )
    expect(kernelOf(board)).toContain('The file it reads from is on procfs')
  })

  it('without a route, names no filesystem: only the VFS, where the handler lives', () => {
    const board = readWith()
    expect(kernelOf(board)).toBe(READ)
    expect(servedOf(board)).toMatchObject({ id: 'vfs', detail: 'fs/read_write.c' })
  })

  it('a refused call says why, and no route', () => {
    const board = routedBoard(
      [
        { type: 'sys_enter', pid: 2, nr: 3, name: 'read', args: [3, 0x5000, 64] },
        { type: 'sys_exit', pid: 2, nr: 3, name: 'read', ret: -9, route: fsRoute('9p', 'v9fs_file_read_iter') },
      ],
      'read'
    )
    expect(kernelOf(board)).toBe("The kernel tries, and stops: fd 3 isn't open for reading.")
  })
})
