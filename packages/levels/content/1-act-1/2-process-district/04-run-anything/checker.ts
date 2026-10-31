import type { CheckInput, ChildRun, TaintEvent } from '@kernelfall/game/types'
import {
  callsOf,
  childrenOf,
  defineChecker,
  exitedWith,
  exitOf,
  failedCalls,
  forkedChildren,
  playerPrograms,
  ranProgram,
} from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import type { Pid } from '@kernelfall/machine/types'
import { EAGAIN, ENOENT, STDERR_FILENO, STDIN_FILENO, STDOUT_FILENO, WAIT_ANY } from '@kernelfall/machine/types'
import { plainText } from '#utils/terminal/index'

/** Folders `ls /` lists on the Machine's root file system, among others. */
const ROOT_ENTRIES = ['bin', 'dev', 'etc', 'home', 'proc', 'sys', 'tmp', 'usr']
/** musl's printf and dprintf write with writev(); a plain write() counts the same. */
const WRITE_CALLS = ['write', 'writev']
/** POSIX shells' status for "command not found". */
const NOT_FOUND_STATUS = 127
/** `false` exits with 1. */
const FALSE_STATUS = 1
/** ksh-lite's prompt (docs/levels/act-1-userland.md, 1.4). */
const PROMPT = 'ksh$ '

/** It read the terminal, or forked children of its own: a second shell is running. */
const actsAsShell = (events: readonly LabEvent[], child: ChildRun): boolean =>
  callsOf(events, child.pid, ['read']).some(({ enter }) => enter.args[0] === STDIN_FILENO) ||
  forkedChildren(events, child.pid).length > 0

/** A command that wasn't found: every execve() failed with ENOENT. */
const notFoundCommand = (child: ChildRun): boolean => child.programs.length === 0 && child.execErrors.includes(ENOENT)

/** `ls /` printed the whole listing, and the shell waited for it before its next prompt. */
function runsLs(events: readonly LabEvent[], shell: Pid, children: readonly ChildRun[]): boolean {
  return children.some((child) => {
    const words = plainText(child.stdout).split(/\s+/)
    if (!ranProgram(child, 'ls') || !ROOT_ENTRIES.every((entry) => words.includes(entry))) {
      return false
    }
    if (child.reapedSeq === null || child.exit === undefined) {
      return false
    }
    const next = callsOf(events, shell, WRITE_CALLS).find(({ enter }) => enter.seq > child.forkSeq)
    return next === undefined || next.enter.seq > child.reapedSeq
  })
}

/** `/bin/echo a b`, run by the shell, printed `a b`. */
const runsPath = (children: readonly ChildRun[]): boolean =>
  children.some((child) => child.programs.includes('/bin/echo') && child.stdout === 'a b\n')

/** `nosuch`: not found on stderr, and the child ended instead of becoming a second shell. */
const notFound = (events: readonly LabEvent[], children: readonly ChildRun[]): boolean =>
  children.some(
    (child) =>
      notFoundCommand(child) &&
      child.stderr.includes('command not found') &&
      child.exit !== undefined &&
      !actsAsShell(events, child)
  )

/**
 * `<command>` then `exit`: the last command the shell waited for is the one
 * expected, it ended with `status`, and the shell exited normally with that same status.
 */
function exitsWithLastStatus(
  events: readonly LabEvent[],
  shell: Pid,
  children: readonly ChildRun[],
  expected: (child: ChildRun) => boolean,
  status: number
): boolean {
  const last = children.filter((child) => child.reapedSeq !== null).at(-1)
  return exitedWith(exitOf(events, shell), status) && last !== undefined && expected(last) && last.exit?.code === status
}

/** fork() failed with EAGAIN, the shell said so on stderr and went on reading commands. */
function survivesForkFailure(events: readonly LabEvent[], shell: Pid): boolean {
  if (exitOf(events, shell)?.signal !== undefined) {
    return false
  }
  return failedCalls(events, shell, ['clone', 'fork'])
    .filter(({ errno }) => errno === EAGAIN)
    .some(({ call }) => {
      const after = (seq: number) => seq > call.enter.seq
      const reported = callsOf(events, shell, WRITE_CALLS).some(
        ({ enter }) => after(enter.seq) && enter.args[0] === STDERR_FILENO
      )
      const readOn = callsOf(events, shell, ['read']).some(
        ({ enter }) => after(enter.seq) && enter.args[0] === STDIN_FILENO
      )
      return reported && readOn
    })
}

/** waitpid(-1, …) after a fork() that failed: the -1 fork() returned, used as a PID. */
function ignoredForkError(events: readonly LabEvent[], shell: Pid): TaintEvent | null {
  for (const { call } of failedCalls(events, shell, ['clone', 'fork'])) {
    const anyChild = callsOf(events, shell, ['wait4']).find(
      // The trace prints arguments unsigned; wait4's pid is a signed int.
      ({ enter }) => enter.seq > call.enter.seq && ((enter.args[0] ?? 0) | 0) === WAIT_ANY
    )
    if (anyChild) {
      return {
        ruleId: 'ignored-fork-error',
        detail: `${call.enter.name}() returned ${call.exit?.ret}, and then the shell called wait4(-1, …), which waits for any child`,
        seq: anyChild.enter.seq,
      }
    }
  }
  return null
}

/**
 * A child whose execvp() failed printed the shell's prompt: exit() flushed the stdout buffer it
 * copied at fork(), so the parent's text shows twice. With nothing buffered, exit() and _exit()
 * leave the same events, and there is nothing to judge.
 */
function exitInChild(events: readonly LabEvent[], children: readonly ChildRun[]): TaintEvent | null {
  for (const child of children) {
    const failedExec = child.programs.length === 0 && child.execErrors.length > 0
    if (failedExec && child.stdout.includes(PROMPT)) {
      const write = callsOf(events, child.pid, ['write', 'writev']).find(({ enter }) => enter.args[0] === STDOUT_FILENO)
      return {
        ruleId: 'exit-in-child',
        detail: `child ${child.pid} wrote ${JSON.stringify(child.stdout)} to stdout after execvp failed: the shell's buffered prompt, flushed a second time`,
        seq: write?.enter.seq ?? child.forkSeq,
      }
    }
  }
  return null
}

/**
 * Objectives are judged over one session of the shell; `(ulimit -u 1; exec ./ksh-lite)`
 * makes its fork() fail. level.yaml declares `no-zombies`, `zombies-left` and `shell-out`.
 */
export const checker = defineChecker({
  // Only a session of the player's own shell is judged: a command typed straight
  // into bash (`/bin/echo a b`) shows nothing about theirs.
  applies: ({ events }: CheckInput) => playerPrograms(events).length > 0,

  check({ events }) {
    const met = new Set<string>()
    const taint: TaintEvent[] = []
    for (const shell of playerPrograms(events)) {
      const children = childrenOf(events, shell)
      const judged: Readonly<Record<string, boolean>> = {
        'runs-ls': runsLs(events, shell, children),
        'runs-path': runsPath(children),
        'not-found': notFound(events, children),
        'exit-status': exitsWithLastStatus(
          events,
          shell,
          children,
          (child) => ranProgram(child, 'false'),
          FALSE_STATUS
        ),
        'exit-127': exitsWithLastStatus(events, shell, children, notFoundCommand, NOT_FOUND_STATUS),
        'fork-fails': survivesForkFailure(events, shell),
      }
      for (const [id, isMet] of Object.entries(judged)) {
        if (isMet) {
          met.add(id)
        }
      }
      const ignored = ignoredForkError(events, shell)
      if (ignored) {
        taint.push(ignored)
      }
      const flushedTwice = exitInChild(events, children)
      if (flushedTwice) {
        taint.push(flushedTwice)
      }
    }
    return { objectivesMet: [...met], taint }
  },
})
