import type { CheckInput } from '@kernelfall/game/types'
import {
  asText,
  basename,
  callsOf,
  defineChecker,
  eventsOf,
  execsOf,
  filesOpened,
  programsNamed,
  writtenTo,
} from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { STDOUT_FILENO } from '@kernelfall/machine/types'
import { plainText } from '#utils/terminal/index'

const SURVEY = '/tmp/survey'
const ETC = '/etc'
const ROOT = '/'
// A path the kernel walks from the working directory, climbing first: `../../etc/motd`.
const RELATIVE_UP = /^\.\.(\/|$)/
// BusyBox on musl makes the old i386 calls (mkdir, rename); glibc on x86-64 the *at ones.
const MKDIR_CALLS = ['mkdir', 'mkdirat']
const RENAME_CALLS = ['rename', 'renameat', 'renameat2']
// Judged by the calls alone, so sendfile64 counts even where the trace holds no data.
const DATA_CALLS = [
  'read',
  'readv',
  'pread64',
  'write',
  'writev',
  'pwrite64',
  'copy_file_range',
  'sendfile',
  'sendfile64',
  'splice',
]

const succeeded = (pid: Pid, events: readonly LabEvent[], names: readonly string[]) =>
  callsOf(events, pid, names).filter(({ exit }) => exit?.ret === 0)

interface Landing {
  readonly path: string
  /** What bash statx()ed right before: each folder of the path, and the folder again before each `..`. */
  readonly checked: readonly string[]
}

// bash chdir()s to the absolute path it worked out, so `cd /` and `cd ..` both land on "/"; only a
// `..` makes bash check a folder on the way there. `cd` is the shell's own call, so any task counts.
function cdLandings(events: readonly LabEvent[]): Landing[] {
  const enters = eventsOf(events, 'sys_enter')
  const pids = new Set(enters.filter((event) => event.name === 'chdir').map((event) => event.pid))
  return [...pids].flatMap((pid) => {
    const landed = new Set(succeeded(pid, events, ['chdir']).map(({ enter }) => enter.seq))
    const landings: Landing[] = []
    let checked: string[] = []
    for (const event of enters.filter((enter) => enter.pid === pid)) {
      if (event.name === 'statx') {
        checked.push(asText(event.data))
        continue
      }
      if (event.name === 'chdir' && landed.has(event.seq)) {
        landings.push({ path: asText(event.data), checked })
      }
      checked = []
    }
    return landings
  })
}

/** A program (not the shell) opened a path that climbs from its working directory. */
const openedRelative = (events: readonly LabEvent[]) =>
  [...new Set(eventsOf(events, 'sched_process_exec').map((event) => event.pid))].some((pid) =>
    filesOpened(events, pid).some(({ path, ret }) => RELATIVE_UP.test(path) && ret !== undefined && ret >= 0)
  )

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
    const landings = cdLandings(events)
    const ls = programsNamed(events, 'ls').map((pid) => plainText(writtenTo(events, pid, STDOUT_FILENO)))
    const judged: Readonly<Record<string, boolean>> = {
      'cd-absolute': landings.some(({ path }) => path === ETC),
      'cd-up': landings.some(({ path, checked }) => path === ROOT && checked.length > 0),
      'relative-path': openedRelative(events),
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
