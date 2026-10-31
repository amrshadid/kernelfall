import type { CheckInput } from '@kernelfall/game/types'
import {
  asText,
  callsOf,
  defineChecker,
  eventsOf,
  execsOf,
  filesOpened,
  programsNamed,
  writtenTo,
} from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { STDERR_FILENO, STDOUT_FILENO } from '@kernelfall/machine/types'

const HOME = '/home/you/'
const PLAN = '/lantern-plan.txt'
const PLAN_END = 'Someday.'
const ATTIC_FOLDERS = ['attic', 'attic/boxes', 'attic/boxes/old', 'attic/shelf']
const GUEST_FILES = ['/tmp/guest-note.txt', '/tmp/lamp-oil.txt']
const DEV_NULL = '/dev/null'
export const PASSWD = '/etc/passwd'
export const DENIED = 'Permission denied'

const linesOf = (text: string): string[] => text.split('\n').filter(Boolean)

// find lists a folder in the order its filesystem keeps it.
const samePaths = (lines: readonly string[], expected: readonly string[]) =>
  lines.length === expected.length && expected.every((path) => lines.includes(path))

const listsAtticFolders = (lines: readonly string[]) =>
  samePaths(lines, ATTIC_FOLDERS) ||
  samePaths(
    lines,
    ATTIC_FOLDERS.map((path) => `${HOME}${path}`)
  )

// bash's child opens the file and dup2()s it onto the fd before execve().
function redirectedTo(events: readonly LabEvent[], pid: Pid, fd: number): string | undefined {
  const exec = execsOf(events, pid)[0]?.seq ?? Number.POSITIVE_INFINITY
  const opened = filesOpened(events, pid).filter(({ seq, ret }) => seq < exec && ret !== undefined && ret >= 0)
  const dup = callsOf(events, pid, ['dup2', 'dup3']).find(
    ({ enter, exit }) => enter.seq < exec && enter.args[1] === fd && exit?.ret === fd
  )
  return dup === undefined ? undefined : opened.findLast(({ ret }) => ret === dup.enter.args[0])?.path
}

// The terminal holds cat's text even where the trace has no sendfile64 data.
const shown = (events: readonly LabEvent[], pid: Pid): string =>
  eventsOf(events, 'console_write')
    .filter((event) => event.pid === pid)
    .map((event) => asText(event.bytes))
    .join('')

function findRuns(events: readonly LabEvent[]) {
  return programsNamed(events, 'find').map((pid) => ({
    stdout: linesOf(writtenTo(events, pid, STDOUT_FILENO)),
    stderr: writtenTo(events, pid, STDERR_FILENO),
    stdoutFile: redirectedTo(events, pid, STDOUT_FILENO),
    stderrFile: redirectedTo(events, pid, STDERR_FILENO),
  }))
}

export const checker = defineChecker({
  // Every command is judged: the Survey uses the Machine's own programs, never the player's.
  applies: ({ events }: CheckInput) => events.length > 0,

  check({ events }) {
    const runs = findRuns(events)
    const passwdRuns = runs.filter(({ stdout, stderr }) => stdout.includes(PASSWD) && stderr.includes(DENIED))
    const judged: Readonly<Record<string, boolean>> = {
      'found-plan': runs.some(({ stdout }) => stdout.length === 1 && (stdout[0] ?? '').endsWith(PLAN)),
      'read-plan': programsNamed(events, 'cat').some(
        (pid) =>
          filesOpened(events, pid).some(({ path, ret }) => path.endsWith(PLAN) && ret !== undefined && ret >= 0) &&
          (shown(events, pid).includes(PLAN_END) || writtenTo(events, pid, STDOUT_FILENO).includes(PLAN_END))
      ),
      'attic-folders': runs.some(({ stdout }) => listsAtticFolders(stdout)),
      'saved-folders': runs.some(({ stdout, stdoutFile }) => stdoutFile !== undefined && listsAtticFolders(stdout)),
      'guest-files': runs.some(({ stdout }) => samePaths(stdout, GUEST_FILES)),
      'two-streams': passwdRuns.some(({ stdoutFile, stderrFile }) => !stdoutFile && !stderrFile),
      'errors-away': passwdRuns.some(({ stdoutFile, stderrFile }) => !stdoutFile && stderrFile === DEV_NULL),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
