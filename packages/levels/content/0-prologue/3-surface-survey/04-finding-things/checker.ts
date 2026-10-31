import type { CheckInput } from '@kernelfall/game/types'
import { defineChecker, programsNamed, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import { STDERR_FILENO, STDOUT_FILENO } from '@kernelfall/machine/types'

const HOME = '/home/you/'
const PLAN = '/lantern-plan.txt'
/** Every folder of the attic (see level.yaml), as found from /home/you. */
const ATTIC_FOLDERS = ['attic', 'attic/boxes', 'attic/boxes/old', 'attic/shelf']
const GUEST_FILES = ['/tmp/guest-note.txt', '/tmp/lamp-oil.txt']
const PASSWD = '/etc/passwd'
const DENIED = 'Permission denied'

const linesOf = (text: string): string[] => text.split('\n').filter(Boolean)

/** The same paths, in any order: find lists a folder in the order its filesystem keeps it. */
const samePaths = (lines: readonly string[], expected: readonly string[]) =>
  lines.length === expected.length && expected.every((path) => lines.includes(path))

/** The attic's folders, walked from /home/you or by absolute path. */
const listsAtticFolders = (lines: readonly string[]) =>
  samePaths(lines, ATTIC_FOLDERS) ||
  samePaths(
    lines,
    ATTIC_FOLDERS.map((path) => `${HOME}${path}`)
  )

function findRuns(events: readonly LabEvent[]) {
  return programsNamed(events, 'find').map((pid) => ({
    stdout: linesOf(writtenTo(events, pid, STDOUT_FILENO)),
    stderr: writtenTo(events, pid, STDERR_FILENO),
  }))
}

/** level.yaml declares the cat objective. */
export const checker = defineChecker({
  // Every command is judged: the Survey uses the Machine's own programs, never the player's.
  applies: ({ events }: CheckInput) => events.length > 0,

  check({ events }) {
    const runs = findRuns(events)
    const judged: Readonly<Record<string, boolean>> = {
      'found-plan': runs.some(({ stdout }) => stdout.length === 1 && (stdout[0] ?? '').endsWith(PLAN)),
      'attic-folders': runs.some(({ stdout }) => listsAtticFolders(stdout)),
      'guest-files': runs.some(({ stdout }) => samePaths(stdout, GUEST_FILES)),
      'two-streams': runs.some(({ stdout, stderr }) => stdout.includes(PASSWD) && stderr.includes(DENIED)),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
