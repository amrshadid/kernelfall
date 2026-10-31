import {
  argvOf,
  basename,
  callsOf,
  childrenOf,
  defineChecker,
  eventsOf,
  execsOf,
  exitedWith,
  filesOpened,
  writtenTo,
} from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import type { Pid } from '@kernelfall/machine/types'
import { STDOUT_FILENO } from '@kernelfall/machine/types'

// checker.test.ts holds this to the Machine's PATH.
export const PATH_DIRS = ['/usr/local/sbin', '/usr/local/bin', '/usr/sbin', '/usr/bin', '/sbin', '/bin']
const SETTING = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/
const NOT_FOUND = 127

/** Tasks nobody here forked that ran no program: the shell itself. */
function shellTasks(events: readonly LabEvent[]): Pid[] {
  const forked = new Set(eventsOf(events, 'sched_process_fork').map((event) => event.childPid))
  const pids = eventsOf(events, 'sys_enter')
    .map((event) => event.pid)
    .filter((pid) => !forked.has(pid) && execsOf(events, pid).length === 0)
  return [...new Set(pids)]
}

/**
 * Tab reads the folder to the end while the line is still being typed; a glob (`cat /etc/mo*`)
 * reads it after Enter. The trace keeps the shell's reads from before Enter but drops its
 * housekeeping there, close() included: a glob's last getdents64 is followed by its close(), Tab's
 * by whatever the shell did next.
 */
function completedIn(events: readonly LabEvent[], dirs: readonly string[]): boolean {
  return shellTasks(events).some((pid) => {
    const calls = callsOf(events, pid, ['open', 'openat', 'getdents64', 'close', 'statx', 'faccessat2', 'fork'])
    return filesOpened(events, pid).some(({ path, ret, seq }) => {
      // Both read a folder by its name with a slash: `/etc/`.
      if (ret === undefined || ret < 0 || !dirs.includes(path.replace(/\/+$/, ''))) {
        return false
      }
      const after = calls.filter(({ enter }) => enter.seq > seq)
      const end = after.findIndex(
        ({ enter, exit }) => enter.name === 'getdents64' && enter.args[0] === ret && exit?.ret === 0
      )
      const next = end < 0 ? undefined : after[end + 1]?.enter
      return end >= 0 && !(next?.name === 'close' && next.args[0] === ret)
    })
  })
}

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

// bash searches PATH itself; finding nothing, its forked copy complains and exits without an execve.
function notFound(events: readonly LabEvent[]): boolean {
  return shellTasks(events).some((shell) =>
    childrenOf(events, shell).some(
      (child) =>
        child.programs.length === 0 &&
        child.execErrors.length === 0 &&
        exitedWith(child.exit, NOT_FOUND) &&
        child.stderr.includes(': command not found')
    )
  )
}

// These happen inside the shell or in env's own process, where no declared check looks.
export const checker = defineChecker({
  applies: ({ events }) => completedIn(events, ['/etc', ...PATH_DIRS]) || childSawSetting(events) || notFound(events),
  check: ({ events }) => ({
    objectivesMet: [
      ...(completedIn(events, ['/etc']) ? ['completes-a-file'] : []),
      ...(completedIn(events, PATH_DIRS) ? ['completes-a-command'] : []),
      ...(childSawSetting(events) ? ['env-adds-a-setting'] : []),
      ...(notFound(events) ? ['not-found'] : []),
    ],
    taint: [],
  }),
})
