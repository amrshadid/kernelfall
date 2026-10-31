import type { CheckInput } from '@kernelfall/game/types'
import { callsOf, defineChecker, eventsOf, programsNamed, reapedBy, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { STDOUT_FILENO } from '@kernelfall/machine/types'
import { readsByAnyTask, tasksOf } from '#content/0-prologue/2-machine-in-section/lab-tasks.util.ts'

/** `/proc/<pid>/status`, or `/proc/self/status` for the reader's own. */
const PROC_STATUS = /^\/proc\/(?:\d+|self)\/status$/

/** Some process read a status file of /proc and got text back. */
const readsProcStatus = (events: readonly LabEvent[]): boolean =>
  readsByAnyTask(events, (path) => PROC_STATUS.test(path)).some(({ text }) => text.length > 0)

/** What the kernel answered `pid`'s calls to `name` (getpid, getppid). */
const answers = (events: readonly LabEvent[], pid: Pid, name: string): number[] =>
  callsOf(events, pid, [name]).flatMap(({ exit }) => (exit && exit.ret > 0 ? [exit.ret] : []))

/** The whole numbers `pid` printed on standard output. */
const printedNumbers = (events: readonly LabEvent[], pid: Pid): number[] =>
  (writtenTo(events, pid, STDOUT_FILENO).match(/\d+/g) ?? []).map(Number)

/** Who started `pid`: the task that forked it, or, when the fork isn't in the command's events, the one that reaped it. */
function starterOf(events: readonly LabEvent[], pid: Pid): Pid | undefined {
  const fork = eventsOf(events, 'sched_process_fork').find((event) => event.childPid === pid)
  if (fork) {
    return fork.parentPid
  }
  return tasksOf(events).find((task) => task !== pid && reapedBy(events, task).has(pid))
}

/** `whoami` printed the answer to its getpid(), and it is its own PID. */
const printsOwnPid = (events: readonly LabEvent[], pid: Pid): boolean =>
  answers(events, pid, 'getpid').some((answer) => answer === pid && printedNumbers(events, pid).includes(answer))

/** `whoami` printed the answer to its getppid(), and it is the shell that started it. */
function printsParentPid(events: readonly LabEvent[], pid: Pid): boolean {
  const shell = starterOf(events, pid)
  return answers(events, pid, 'getppid').some(
    (answer) => (shell === undefined || answer === shell) && printedNumbers(events, pid).includes(answer)
  )
}

/** level.yaml declares `exits-zero`. */
// SIMPLIFIED: "two runs print two different PIDs" isn't judged: a checker sees one
// command at a time. Each run's printed PID is checked against its real one instead.
export const checker = defineChecker({
  applies: ({ events }: CheckInput) => programsNamed(events, 'whoami').length > 0 || readsProcStatus(events),

  check({ events }) {
    const runs = programsNamed(events, 'whoami')
    const judged: Readonly<Record<string, boolean>> = {
      'reads-proc-status': readsProcStatus(events),
      'prints-own-pid': runs.some((pid) => printsOwnPid(events, pid)),
      'prints-parent-pid': runs.some((pid) => printsParentPid(events, pid)),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
