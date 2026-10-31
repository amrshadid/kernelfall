import type { CheckInput, OpenedFile } from '@kernelfall/game/types'
import {
  asText,
  basename,
  defineChecker,
  eventsOf,
  execsOf,
  failedCalls,
  filesOpened,
  programsNamed,
  writtenTo,
} from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { EACCES, STDOUT_FILENO } from '@kernelfall/machine/types'
import { plainText } from '#utils/terminal/index'

const NOTE = 'notes.txt'
const COPY = 'hi'
const BOX = 'box'
// runuser (and a PAM su) forks for its session and runs cat in the child; BusyBox's su and setpriv exec
// it in the same task. So the switch is in cat's task or one of its fork parents.
const AS_ANOTHER_USER = new Set(['runuser', 'su', 'setpriv'])
/** `-rw-------`: the read bits of owner, group and other sit at these places. */
const OWNER_READ = 1
const GROUP_READ = 4
const OTHER_READ = 7

const parentName = (path: string) => basename(path.slice(0, Math.max(path.lastIndexOf('/'), 0)))

function switchedUser(events: readonly LabEvent[], pid: Pid): boolean {
  const parents = new Map(eventsOf(events, 'sched_process_fork').map((fork) => [fork.childPid, fork.parentPid]))
  for (let task: Pid | undefined = pid; task !== undefined; task = parents.get(task)) {
    if (execsOf(events, task).some((exec) => AS_ANOTHER_USER.has(basename(exec.filename)))) {
      return true
    }
  }
  return false
}

const neighbourPids = (events: readonly LabEvent[]): ReadonlySet<Pid> =>
  new Set(programsNamed(events, 'cat').filter((pid) => switchedUser(events, pid)))

function playerCatOpens(events: readonly LabEvent[], neighbours: ReadonlySet<Pid>): OpenedFile[] {
  return programsNamed(events, 'cat')
    .filter((pid) => !neighbours.has(pid))
    .flatMap((pid) => filesOpened(events, pid))
}

// bash's child tries the execve() first, then explains the refusal. Only hi's counts: `./notes.txt` is
// refused too, but it was never a program.
function execRefused(events: readonly LabEvent[]): boolean {
  const pids = new Set(
    eventsOf(events, 'sys_enter')
      .filter((event) => event.name === 'execve')
      .map((event) => event.pid)
  )
  return [...pids].some((pid) =>
    failedCalls(events, pid, ['execve']).some(
      ({ call, errno }) => errno === EACCES && basename(asText(call.enter.data)) === COPY
    )
  )
}

// BusyBox's ls colours the name on a terminal.
function showsPrivateNote(stdout: string): boolean {
  return plainText(stdout)
    .split('\n')
    .some((line) => {
      const words = line.trim().split(/\s+/)
      const mode = words[0] ?? ''
      return (
        basename(words.at(-1) ?? '') === NOTE &&
        mode.length === 10 &&
        mode[OWNER_READ] === 'r' &&
        mode[GROUP_READ] !== 'r' &&
        mode[OTHER_READ] !== 'r'
      )
    })
}

/** level.yaml declares the chmod objective. */
export const checker = defineChecker({
  // Every command is judged: the Survey uses the Machine's own programs, never the player's.
  applies: ({ events }: CheckInput) => events.length > 0,

  check({ events }) {
    const neighbours = neighbourPids(events)
    const throughBox = playerCatOpens(events, neighbours).filter(({ path }) => parentName(path) === BOX)
    const judged: Readonly<Record<string, boolean>> = {
      'exec-denied': execRefused(events),
      'exec-allowed': eventsOf(events, 'sched_process_exec').some((event) => basename(event.filename) === COPY),
      'dir-denied': throughBox.some(({ ret }) => ret === -EACCES),
      'dir-allowed': throughBox.some(({ ret }) => ret !== undefined && ret >= 0),
      'note-private': programsNamed(events, 'ls').some((pid) =>
        showsPrivateNote(writtenTo(events, pid, STDOUT_FILENO))
      ),
      'neighbour-denied': [...neighbours].some((pid) =>
        filesOpened(events, pid).some(({ path, ret }) => basename(path) === NOTE && ret === -EACCES)
      ),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
