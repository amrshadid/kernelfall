import type { LabEvent, Pid } from '@kernelfall/machine/events'
import type { SyscallRecord } from '#types/definitions/queries'
import { asText, eventsBetween, eventsOf } from '#utils/queries/event-queries.util'
import { callsOf } from '#utils/queries/syscall-queries.util'

/** write(fd, buf, count) and writev(fd, iov, iovcnt): where `fd` and write's `count` sit. */
const WRITE_FD_ARG = 0
const WRITE_COUNT_ARG = 2
// musl's stdio and bash's builtins write with writev(), so a write to a file is either call.
const WRITE_CALLS = ['write', 'writev']

/** The write() and writev() calls `pid` made on file descriptor `fd`, in order. */
export const writesTo = (events: readonly LabEvent[], pid: Pid, fd: number): SyscallRecord[] =>
  callsOf(events, pid, WRITE_CALLS).filter((call) => call.enter.args[WRITE_FD_ARG] === fd)

/**
 * What `pid` wrote to file descriptor `fd`: the bytes each write() was handed,
 * joined. A write the kernel took only part of still counts in full here.
 */
export function writtenTo(events: readonly LabEvent[], pid: Pid, fd: number): string {
  return writesTo(events, pid, fd)
    .map((call) => asText(call.enter.data))
    .join('')
}

/** A write of at least one byte that the kernel took in full: it returned the count asked for. */
export function isWholeWrite({ enter, exit }: SyscallRecord): boolean {
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
