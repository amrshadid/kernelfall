import type { LabEvent, Pid } from '@kernelfall/machine/events'
import type { CheckInput } from '#types/definitions/checker'
import type { ArgsMatch, ObjectiveCheck } from '#types/definitions/checks'
import type { SyscallRecord } from '#types/definitions/queries'
import { matchesText } from '#utils/checker/text-match.util'
import {
  argvOf,
  callsOf,
  consoleBetween,
  execsOf,
  exitedWith,
  exitOf,
  forkedChildren,
  isWholeWrite,
  judgedProcesses,
  readsOf,
  writesTo,
  writtenTo,
} from '#utils/queries/index'

/** Before every event: where a process's output starts when its execve() isn't in the events. */
const BEFORE_FIRST_SEQ = -1

/** The kernel's answer `call` must have given: `-errno`, `ret`, or with neither, any. */
function returned(call: SyscallRecord, ret: number | undefined, errno: number | undefined): boolean {
  if (errno !== undefined) {
    return call.exit?.ret === -errno
  }
  return ret === undefined || call.exit?.ret === ret
}

/** The seq a process's run ends at: its exit, or past every event while it still runs. */
const endOf = (events: readonly LabEvent[], pid: Pid): number => exitOf(events, pid)?.seq ?? Number.POSITIVE_INFINITY

/** What reached the terminal from `pid`'s first execve() to its exit. */
function terminalOf(events: readonly LabEvent[], pid: Pid): string {
  const start = execsOf(events, pid)[0]?.seq ?? BEFORE_FIRST_SEQ
  return consoleBetween(events, start, endOf(events, pid))
}

/** `pid` forked at least `commands` children and reaped each one before it ended. */
function reapedEvery(events: readonly LabEvent[], pid: Pid, commands: number): boolean {
  const children = forkedChildren(events, pid)
  const end = endOf(events, pid)
  return children.length >= commands && children.every((child) => child.reapedSeq !== null && child.reapedSeq < end)
}

/** Whether one declared objective check holds for a command's events and the build history. */
export function meetsObjectiveCheck(check: ObjectiveCheck, { events, builds }: CheckInput): boolean {
  switch (check.kind) {
    case 'compiles':
      // Only a program that compiled and linked can be run with execve().
      return judgedProcesses(events).length > 0
    case 'build-fixed':
      return builds?.failedEarlier === true && builds.latestErrors === 0
    case 'exit-status':
      return judgedProcesses(events, check).some((pid) => exitedWith(exitOf(events, pid), check.status))
    case 'wrote':
      return judgedProcesses(events, check).some(
        (pid) =>
          writesTo(events, pid, check.fd).some(isWholeWrite) &&
          (check.text === undefined || matchesText(writtenTo(events, pid, check.fd), check.text))
      )
    case 'terminal':
      return judgedProcesses(events, check).some((pid) => matchesText(terminalOf(events, pid), check.text))
    case 'syscall':
      return judgedProcesses(events, check).some((pid) =>
        callsOf(events, pid, check.names).some((call) => returned(call, check.ret, check.errno))
      )
    case 'no-zombies-after':
      return judgedProcesses(events, check).some((pid) => reapedEvery(events, pid, check.commands))
    case 'ran':
      return judgedProcesses(events, check).some(
        (pid) =>
          (check.args === undefined || matchesArgs(argvOf(events, pid, check.program), check.args)) &&
          (check.status === undefined || exitedWith(exitOf(events, pid), check.status))
      )
    case 'read-to-end':
      return judgedProcesses(events, check).some((pid) =>
        readsOf(events, pid, check.path).some(
          (read) => read.reachedEnd && (check.text === undefined || matchesText(read.text, check.text))
        )
      )
  }
}

/** Whether the arguments after the program's name meet `match`; unknown arguments never do. */
function matchesArgs(argv: readonly string[] | undefined, match: ArgsMatch): boolean {
  if (argv === undefined) {
    return false
  }
  const args = argv.slice(1)
  return (
    (match.min === undefined || args.length >= match.min) &&
    (match.match ?? []).every((pattern) => args.some((arg) => new RegExp(pattern).test(arg)))
  )
}
