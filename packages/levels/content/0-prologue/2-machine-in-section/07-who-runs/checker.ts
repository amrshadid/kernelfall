import type { CheckInput } from '@kernelfall/game/types'
import { callsOf, defineChecker, eventsOf, programsNamed, reapedBy, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { STDOUT_FILENO } from '@kernelfall/machine/types'
import { readsByAnyTask, tasksOf } from '#content/0-prologue/2-machine-in-section/lab-tasks.util.ts'

const PROC_STATUS = /^\/proc\/(?:\d+|self)\/status$/
const CROWD = 3

const readsProcStatus = (events: readonly LabEvent[]): boolean =>
  readsByAnyTask(events, (path) => PROC_STATUS.test(path)).some(({ text }) => text.length > 0)

// BusyBox ps and top both print the state as a column of its own, the command last.
const runnableYes = (table: string): number =>
  table.split('\n').filter((line) => {
    const words = line.trim().split(/\s+/)
    return words.includes('R') && words.at(-1) === 'yes'
  }).length

const sharesOneCpu = (events: readonly LabEvent[]): boolean =>
  ['top', 'ps'].some((name) =>
    programsNamed(events, name).some((pid) => runnableYes(writtenTo(events, pid, STDOUT_FILENO)) >= CROWD)
  )

const answers = (events: readonly LabEvent[], pid: Pid, name: string): number[] =>
  callsOf(events, pid, [name]).flatMap(({ exit }) => (exit && exit.ret > 0 ? [exit.ret] : []))

const printedNumbers = (events: readonly LabEvent[], pid: Pid): number[] =>
  (writtenTo(events, pid, STDOUT_FILENO).match(/\d+/g) ?? []).map(Number)

// When the fork isn't in the command's events, the task that reaped it started it.
function starterOf(events: readonly LabEvent[], pid: Pid): Pid | undefined {
  const fork = eventsOf(events, 'sched_process_fork').find((event) => event.childPid === pid)
  if (fork) {
    return fork.parentPid
  }
  return tasksOf(events).find((task) => task !== pid && reapedBy(events, task).has(pid))
}

const printsOwnPid = (events: readonly LabEvent[], pid: Pid): boolean =>
  answers(events, pid, 'getpid').some((answer) => answer === pid && printedNumbers(events, pid).includes(answer))

function printsParentPid(events: readonly LabEvent[], pid: Pid): boolean {
  const shell = starterOf(events, pid)
  return answers(events, pid, 'getppid').some(
    (answer) => (shell === undefined || answer === shell) && printedNumbers(events, pid).includes(answer)
  )
}

// SIMPLIFIED: "two runs print two different PIDs" isn't judged: a checker sees one
// command at a time. Each run's printed PID is checked against its real one instead.
export const checker = defineChecker({
  applies: ({ events }: CheckInput) =>
    ['mypid', 'top', 'ps'].some((name) => programsNamed(events, name).length > 0) || readsProcStatus(events),

  check({ events }) {
    const runs = programsNamed(events, 'mypid')
    const judged: Readonly<Record<string, boolean>> = {
      'reads-proc-status': readsProcStatus(events),
      'shares-one-cpu': sharesOneCpu(events),
      'prints-own-pid': runs.some((pid) => printsOwnPid(events, pid)),
      'prints-parent-pid': runs.some((pid) => printsParentPid(events, pid)),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
