import type { CheckInput, FinishedCommand, OpenedFile } from '@kernelfall/game/types'
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

/** The owner's `x` after a mode is applied to a file whose owner had `x` or not; null when unreadable. */
type OwnerExec = (before: boolean) => boolean | null

// Without `ugoa`, chmod acts as `a` minus the umask's bits; the Machine's umask (022) never masks the owner's.
function symbolicOwnerExec(mode: string): OwnerExec | null {
  const clauses = mode.split(',').map((clause) => /^([ugoa]*)((?:[-+=][rwxst]*)+)$/.exec(clause))
  if (clauses.some((clause) => clause === null)) {
    return null
  }
  return (before) =>
    clauses.reduce((exec, clause) => {
      const [, who = '', actions = ''] = clause ?? []
      if (who !== '' && !/[ua]/.test(who)) {
        return exec
      }
      for (const [, op, perms = ''] of actions.matchAll(/([-+=])([rwxst]*)/g)) {
        if (op === '=') exec = perms.includes('x')
        else if (perms.includes('x')) exec = op === '+'
      }
      return exec
    }, before)
}

function ownerExecOf(mode: string): OwnerExec | null {
  if (/^[0-7]{1,4}$/.test(mode)) {
    const owner = (Number.parseInt(mode, 8) & 0o100) !== 0
    return () => owner
  }
  return symbolicOwnerExec(mode)
}

// Quotes, globs, variables and compound lines would need bash to expand them: such a line isn't read.
const SHELL_SYNTAX = /[;&|<>`$(){}*?[\]'"\\~]/
const sameFile = (operand: string, name: string) => basename(operand.replace(/\/+$/, '')) === name

/** A plain `chmod MODE FILE…` line that succeeded: its effect on the owner's `x`, and its files. */
function chmodOf({ commandLine, status }: FinishedCommand): { exec: OwnerExec; files: string[] } | null {
  const words = commandLine.trim().split(/\s+/)
  if (status !== 0 || SHELL_SYNTAX.test(commandLine) || basename(words[0] ?? '') !== 'chmod') {
    return null
  }
  // `-x` and `-w` are modes, not options; BusyBox chmod's options are -R, -v, -c and -f.
  const args = words.slice(1).filter((word) => !/^-[Rvcf]+$/.test(word))
  const exec = ownerExecOf(args[0] ?? '')
  return exec && args.length > 1 ? { exec, files: args.slice(1) } : null
}

const removedExec = (history: readonly FinishedCommand[], name: string): boolean =>
  history.some((command) => {
    const chmod = chmodOf(command)
    return chmod?.files.some((file) => sameFile(file, name)) === true && chmod.exec(true) === false
  })

// A new folder from `mkdir` has its owner's `x` (umask 022); each chmod of it then decides.
function folderSearchable(history: readonly FinishedCommand[], name: string): boolean {
  let searchable = true
  for (const command of history) {
    const words = command.commandLine.trim().split(/\s+/)
    if (command.status === 0 && words[0] === 'mkdir' && !words.includes('-m') && words.some((w) => sameFile(w, name))) {
      searchable = true
    }
    const chmod = chmodOf(command)
    if (chmod?.files.some((file) => sameFile(file, name))) {
      searchable = chmod.exec(searchable) ?? searchable
    }
  }
  return searchable
}

/** level.yaml declares the chmod objective. */
export const checker = defineChecker({
  // Every command is judged: the Survey uses the Machine's own programs, never the player's.
  applies: ({ events }: CheckInput) => events.length > 0,

  check({ events, history = [] }) {
    const neighbours = neighbourPids(events)
    const throughBox = playerCatOpens(events, neighbours).filter(({ path }) => parentName(path) === BOX)
    const judged: Readonly<Record<string, boolean>> = {
      'exec-denied': execRefused(events),
      'exec-allowed':
        eventsOf(events, 'sched_process_exec').some((event) => basename(event.filename) === COPY) &&
        removedExec(history, COPY),
      // The kernel refuses at box's path step before it looks at the file, so the file's own mode can't be the cause.
      'dir-denied': throughBox.some(({ ret }) => ret === -EACCES) && !folderSearchable(history, BOX),
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
