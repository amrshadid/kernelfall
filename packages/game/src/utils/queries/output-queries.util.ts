import type { LabEvent, Pid } from '@kernelfall/machine/events'
import type { SyscallRecord } from '#types/definitions/queries'
import { asText, eventsBetween, eventsOf } from '#utils/queries/event-queries.util'
import { callsOf } from '#utils/queries/syscall-queries.util'

/** write(fd, buf, count) and writev(fd, iov, iovcnt): where `fd` and write's `count` sit. */
const WRITE_FD_ARG = 0
const WRITE_COUNT_ARG = 2
/** splice(fd_in, off_in, fd_out, …). */
const SPLICE_OUT_FD_ARG = 2
// musl's stdio and bash's builtins write with writev(), busybox's cat with sendfile64().
const SPLICE_CALLS = ['sendfile', 'sendfile64', 'splice']
const WRITE_CALLS = ['write', 'writev', ...SPLICE_CALLS]

const isSplice = (call: SyscallRecord) => SPLICE_CALLS.includes(call.enter.name)

const outFd = (call: SyscallRecord) => call.enter.args[call.enter.name === 'splice' ? SPLICE_OUT_FD_ARG : WRITE_FD_ARG]

export const writesTo = (events: readonly LabEvent[], pid: Pid, fd: number): SyscallRecord[] =>
  callsOf(events, pid, WRITE_CALLS).filter((call) => outFd(call) === fd)

/**
 * What `pid` wrote to file descriptor `fd`, joined. A write the kernel took only part of still
 * counts in full here.
 */
export function writtenTo(events: readonly LabEvent[], pid: Pid, fd: number): string {
  // sendfile and splice learn what they moved only at their exit.
  return writesTo(events, pid, fd)
    .map((call) => asText(isSplice(call) ? call.exit?.data : call.enter.data))
    .join('')
}

/** A write of at least one byte that the kernel took in full: it returned the count asked for. */
export function isWholeWrite(call: SyscallRecord): boolean {
  const { enter, exit } = call
  // busybox's cat asks for 16 MiB, so sendfile's count is only an upper bound.
  if (isSplice(call)) {
    return exit !== undefined && exit.ret > 0
  }
  // writev's third argument counts iovecs, not bytes. The VM captures only the start of its data,
  // so a capture shorter than the result is cut, not a short write.
  // SIMPLIFIED: a writev that wrote more than the capture but less than asked counts as whole.
  if (enter.name === 'writev') {
    const captured = enter.data?.length
    return captured !== undefined && captured > 0 && exit !== undefined && exit.ret >= captured
  }
  const count = enter.args[WRITE_COUNT_ARG]
  return count !== undefined && count > 0 && exit?.ret === count
}

/** Everything that reached the console between two events, by `seq`. */
export function consoleBetween(events: readonly LabEvent[], fromSeq: number, toSeq: number): string {
  return eventsOf(eventsBetween(events, fromSeq, toSeq), 'console_write')
    .map((event) => asText(event.bytes))
    .join('')
}
