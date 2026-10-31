import type { CheckInput, OpenedFile } from '@kernelfall/game/types'
import {
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

const NOTE = 'notes.txt'
/** The copy of /bin/echo the worked example takes the `x` bit from. */
const COPY = 'hi'
const BOX = 'box'
/** How root runs a command as another user; init knocks for the neighbour with it. */
const RUNUSER = 'runuser'
/** `-rw-------`: the read bits of owner, group and other sit at these places. */
const OWNER_READ = 1
const GROUP_READ = 4
const OTHER_READ = 7

const parentName = (path: string) => basename(path.slice(0, Math.max(path.lastIndexOf('/'), 0)))

/** `cat`'s opens, from tasks that ran it as the player (not through runuser). */
function playerCatOpens(events: readonly LabEvent[], neighbours: ReadonlySet<Pid>): OpenedFile[] {
  return programsNamed(events, 'cat')
    .filter((pid) => !neighbours.has(pid))
    .flatMap((pid) => filesOpened(events, pid))
}

/** Tasks that ran `runuser`: whatever they run after it runs as the neighbour. */
const neighbourPids = (events: readonly LabEvent[]): ReadonlySet<Pid> =>
  new Set(
    programsNamed(events, RUNUSER).filter((pid) => execsOf(events, pid).some((e) => basename(e.filename) === 'cat'))
  )

/** Any task's execve() the kernel refused with EACCES: the shell's, or a child's. */
function execRefused(events: readonly LabEvent[]): boolean {
  const pids = new Set(
    eventsOf(events, 'sys_enter')
      .filter((event) => event.name === 'execve')
      .map((event) => event.pid)
  )
  return [...pids].some((pid) => failedCalls(events, pid, ['execve']).some(({ errno }) => errno === EACCES))
}

/** An `ls -l` line for the note whose read bits are on for its owner only. */
function showsPrivateNote(stdout: string): boolean {
  return stdout.split('\n').some((line) => {
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
