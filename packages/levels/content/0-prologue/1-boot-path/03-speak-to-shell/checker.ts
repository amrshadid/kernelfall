import { argvOf, basename, defineChecker, eventsOf, execsOf, readsOf, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import type { Pid } from '@kernelfall/machine/types'
import { STDOUT_FILENO } from '@kernelfall/machine/types'

/** The folders of the lab's PATH, where a command name is completed. */
const PATH_DIRS = ['/bin', '/usr/bin']
/** `NAME=value`, as env(1) takes a setting before the program it runs. */
const SETTING = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/

/**
 * The shell's own tasks: they made syscalls but never became a program in these
 * events, and nobody here forked them. Its Tab completion is its own read of a folder.
 */
function shellTasks(events: readonly LabEvent[]): Pid[] {
  const forked = new Set(eventsOf(events, 'sched_process_fork').map((event) => event.childPid))
  const pids = eventsOf(events, 'sys_enter')
    .map((event) => event.pid)
    .filter((pid) => !forked.has(pid) && execsOf(events, pid).length === 0)
  return [...new Set(pids)]
}

/** The shell read one of `dirs` to its end, as completing a name in it does. */
function completedIn(events: readonly LabEvent[], dirs: readonly string[]): boolean {
  const withSlash = dirs.flatMap((dir) => [dir, `${dir}/`])
  return shellTasks(events).some((pid) =>
    withSlash.some((dir) => readsOf(events, pid, dir).some((read) => read.reachedEnd))
  )
}

/** `env NAME=value program…` became the program, and the program printed the value it was handed. */
function childSawSetting(events: readonly LabEvent[]): boolean {
  return eventsOf(events, 'sched_process_exec').some(({ pid }) => {
    const settings = (argvOf(events, pid, 'env') ?? []).slice(1).flatMap((arg) => {
      const match = SETTING.exec(arg)
      return match?.[2] ? [match[2]] : []
    })
    const becameAnother = execsOf(events, pid).some(({ filename }) => basename(filename) !== 'env')
    const printed = writtenTo(events, pid, STDOUT_FILENO)
    return becameAnother && settings.some((value) => printed.includes(`${value}\n`))
  })
}

// Tab completion runs inside the shell, and env's child is the same process, so no declared check sees them.
export const checker = defineChecker({
  applies: ({ events }) => completedIn(events, ['/etc', ...PATH_DIRS]) || childSawSetting(events),
  check: ({ events }) => ({
    objectivesMet: [
      ...(completedIn(events, ['/etc']) ? ['completes-a-file'] : []),
      ...(completedIn(events, PATH_DIRS) ? ['completes-a-command'] : []),
      ...(childSawSetting(events) ? ['env-adds-a-setting'] : []),
    ],
    taint: [],
  }),
})
