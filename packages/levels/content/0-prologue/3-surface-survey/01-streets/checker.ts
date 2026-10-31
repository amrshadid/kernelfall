import type { CheckInput } from '@kernelfall/game/types'
import {
  asText,
  basename,
  callsOf,
  defineChecker,
  eventsOf,
  execsOf,
  programsNamed,
  writtenTo,
} from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { STDOUT_FILENO } from '@kernelfall/machine/types'
import { plainText } from '#utils/terminal/index'

const SURVEY = '/tmp/survey'
/** The walk's stops: `cd /etc`, `cd ..` and `cd home/you`, by where each one lands. */
const ETC = '/etc'
const ROOT = '/'
const HOME = '/home/you'
const MKDIR_CALLS = ['mkdir', 'mkdirat']
const RENAME_CALLS = ['rename', 'renameat', 'renameat2']
/** Every way a program can move a file's bytes. */
const DATA_CALLS = ['read', 'write', 'copy_file_range', 'sendfile', 'splice']

const succeeded = (pid: Pid, events: readonly LabEvent[], names: readonly string[]) =>
  callsOf(events, pid, names).filter(({ exit }) => exit?.ret === 0)

// Like bash, the shell chdir()s to the absolute path it worked out, so a cd is judged by where it lands.
/** The paths every successful chdir() went to; `cd` is the shell's own call, so any task counts. */
function chdirPaths(events: readonly LabEvent[]): string[] {
  const pids = new Set(
    eventsOf(events, 'sys_enter')
      .filter((event) => event.name === 'chdir')
      .map((event) => event.pid)
  )
  return [...pids].flatMap((pid) => succeeded(pid, events, ['chdir']).map(({ enter }) => asText(enter.data)))
}

/** `ls -i`'s `<inode> <name>` pairs, in the order printed. */
function inodeEntries(stdout: string): { readonly inode: string; readonly name: string }[] {
  return [...stdout.matchAll(/(\d+) +(\S+)/g)].map(([, inode = '', name = '']) => ({ inode, name }))
}

/** Two names of one file name (a file and its copy) with different inode numbers. */
function showsCopy(stdout: string): boolean {
  const entries = inodeEntries(stdout)
  return entries.some((a, i) =>
    entries.some((b, j) => i !== j && basename(a.name) === basename(b.name) && a.inode !== b.inode)
  )
}

/** `ls -R`'s sections: each folder's header (without its `:`) and the names under it. */
function recursiveListing(stdout: string): ReadonlyMap<string, readonly string[]> {
  const sections = new Map<string, string[]>()
  for (const block of stdout.split('\n\n')) {
    const [header = '', ...rest] = block.split('\n')
    if (!header.endsWith(':')) {
      return new Map()
    }
    sections.set(header.slice(0, -1).replace(/(.)\/+$/, '$1'), rest.join(' ').split(/\s+/).filter(Boolean).sort())
  }
  return sections
}

const sameNames = (names: readonly string[] | undefined, expected: readonly string[]) =>
  names !== undefined && names.join('/') === expected.join('/')

/** Exactly `maps/os-release` and an empty `notes/`, listed from /tmp/survey or from inside it. */
function showsSurveyTree(stdout: string): boolean {
  const sections = recursiveListing(stdout)
  return [SURVEY, '.'].some(
    (root) =>
      sections.size === 3 &&
      sameNames(sections.get(root), ['maps', 'notes']) &&
      sameNames(sections.get(`${root}/maps`), ['os-release']) &&
      sameNames(sections.get(`${root}/notes`), [])
  )
}

/** bash's builtin pwd (the shell's own task, which never became a program) or /bin/pwd printed /tmp/survey. */
function standsInSurvey(events: readonly LabEvent[]): boolean {
  const forked = new Set(eventsOf(events, 'sched_process_fork').map((event) => event.childPid))
  const shells = eventsOf(events, 'sys_enter')
    .map((event) => event.pid)
    .filter((pid) => !forked.has(pid) && execsOf(events, pid).length === 0)
  return [...new Set([...shells, ...programsNamed(events, 'pwd')])].some(
    (pid) => writtenTo(events, pid, STDOUT_FILENO) === `${SURVEY}\n`
  )
}

/** The calls `pid` made as `program`, after its execve(): the shell's child makes some of its own before. */
function callsAs(events: readonly LabEvent[], pid: Pid, names: readonly string[]) {
  const since = execsOf(events, pid)[0]?.seq ?? Number.POSITIVE_INFINITY
  return callsOf(events, pid, names).filter(({ enter }) => enter.seq > since)
}

/** level.yaml declares the rmdir objectives. */
export const checker = defineChecker({
  // Every command is judged: the Survey uses the Machine's own programs, never the player's.
  applies: ({ events }: CheckInput) => events.length > 0,

  check({ events }) {
    const paths = chdirPaths(events)
    const ls = programsNamed(events, 'ls').map((pid) => plainText(writtenTo(events, pid, STDOUT_FILENO)))
    const judged: Readonly<Record<string, boolean>> = {
      'cd-absolute': paths.includes(ETC),
      'cd-up': paths.includes(ROOT),
      'cd-relative': paths.includes(HOME),
      'mkdir-parents': programsNamed(events, 'mkdir').some((pid) => succeeded(pid, events, MKDIR_CALLS).length >= 2),
      'copy-new-inode': ls.some(showsCopy),
      'rename-no-bytes': programsNamed(events, 'mv').some(
        (pid) => succeeded(pid, events, RENAME_CALLS).length > 0 && callsAs(events, pid, DATA_CALLS).length === 0
      ),
      'survey-tree': ls.some(showsSurveyTree),
      'stands-in-survey': standsInSurvey(events),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
