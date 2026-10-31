import type { LabEvent, LabEventOf, Pid } from '@kernelfall/machine/events'
import type { FailedCall, FileRead, OpenedFile, SyscallRecord } from '#types/definitions/queries'
import { asText } from '#utils/queries/event-queries.util'

/** The syscalls that open a file by path; musl on i386 uses open, other libcs openat. */
const OPEN_CALLS = ['open', 'openat']
/**
 * The calls that read an open file or folder; each answers 0 at its end. busybox's cat copies
 * with sendfile64 (the kernel moves the bytes itself), so that is a read of the file too.
 */
const READ_CALLS = ['read', 'readv', 'pread64', 'getdents64', 'sendfile', 'sendfile64']
/** read(fd, …), getdents64(fd, …) and close(fd) take the fd first; sendfile(out_fd, in_fd, …) second. */
const FD_ARG = 0
const SENDFILE_IN_FD_ARG = 1
const SENDFILE_CALLS = new Set(['sendfile', 'sendfile64'])
const readFd = (call: SyscallRecord) =>
  call.enter.args[SENDFILE_CALLS.has(call.enter.name) ? SENDFILE_IN_FD_ARG : FD_ARG]

/**
 * A path as the kernel resolves it, for comparing: `/bin/`, `/bin//` and `/bin/.` all name `/bin`.
 * SIMPLIFIED: a relative path stays relative; the shell's cwd isn't known here.
 */
export function samePath(a: string, b: string): boolean {
  const normal = (path: string) =>
    path
      .split('/')
      .filter((part, i) => part !== '.' && (part !== '' || i === 0))
      .join('/') || '/'
  return normal(a) === normal(b)
}
/** Where `flags` sits: open(path, flags, mode) and openat(dirfd, path, flags, mode). */
const OPEN_FLAGS_ARG = 1
const OPENAT_FLAGS_ARG = 2

/** Every call `pid` made to the syscalls named, in order, each paired with its return. */
export function callsOf(events: readonly LabEvent[], pid: Pid, names: readonly string[]): SyscallRecord[] {
  const calls: SyscallRecord[] = []
  events.forEach((event, at) => {
    if (event.type !== 'sys_enter' || event.pid !== pid || !names.includes(event.name)) {
      return
    }
    // A task runs one syscall at a time, so its next sys_exit is this call's,
    // unless the call never returned (execve() that worked, exit_group()).
    const exit = events
      .slice(at + 1)
      .find((later): later is LabEventOf<'sys_exit'> => later.type === 'sys_exit' && later.pid === pid)
    calls.push({ enter: event, exit: exit?.name === event.name ? exit : undefined })
  })
  return calls
}

/** The calls of `pid` to `names` that failed, each with its errno (positive, like errno). */
export function failedCalls(events: readonly LabEvent[], pid: Pid, names: readonly string[]): FailedCall[] {
  return callsOf(events, pid, names).flatMap((call) =>
    call.exit && call.exit.ret < 0 ? [{ call, errno: -call.exit.ret }] : []
  )
}

/**
 * Each time `pid` opened `path` (as passed), with how far it read it: the
 * read() and getdents64() calls on the new fd until it was closed.
 */
export function readsOf(events: readonly LabEvent[], pid: Pid, path: string): FileRead[] {
  const calls = callsOf(events, pid, [...READ_CALLS, 'close'])
  return filesOpened(events, pid).flatMap((opened): FileRead[] => {
    const fd = opened.ret
    if (!samePath(opened.path, path) || fd === undefined || fd < 0) {
      return []
    }
    const after = calls.filter((call) => call.enter.seq > opened.seq && readFd(call) === fd)
    const closedAt = after.find((call) => call.enter.name === 'close')?.enter.seq ?? Number.POSITIVE_INFINITY
    const reads = after.filter((call) => call.enter.name !== 'close' && call.enter.seq < closedAt)
    return [
      {
        path,
        fd,
        reachedEnd: reads.some((call) => call.exit?.ret === 0),
        // getdents64() fills binary records, not text.
        text: reads
          .filter((call) => call.enter.name === 'read' && (call.exit?.ret ?? 0) > 0)
          .map((call) => asText(call.exit?.data))
          .join(''),
      },
    ]
  })
}

/** Every file `pid` asked to open, in order, with the kernel's answer. */
export function filesOpened(events: readonly LabEvent[], pid: Pid): OpenedFile[] {
  return callsOf(events, pid, OPEN_CALLS).map(({ enter, exit }) => ({
    path: asText(enter.data),
    // An argument the trace didn't record reads as 0, which is O_RDONLY.
    flags: enter.args[enter.name === 'open' ? OPEN_FLAGS_ARG : OPENAT_FLAGS_ARG] ?? 0,
    ret: exit?.ret,
    seq: enter.seq,
  }))
}
