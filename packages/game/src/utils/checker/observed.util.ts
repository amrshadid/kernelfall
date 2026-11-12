import type { CheckInput } from '#types/definitions/checker'
import type { ObjectiveCheck, ProgramScope, TextMatch } from '#types/definitions/checks'
import type { ProcessExit } from '#types/definitions/queries'
import { terminalOf } from '#utils/checker/objective-checks.util'
import {
  argvOf,
  callsOf,
  exitedWith,
  exitOf,
  forkedChildren,
  isWholeWrite,
  judgedProcesses,
  readsOf,
  writesTo,
  writtenTo,
} from '#utils/queries/index'

const SHOWN_CHARS = 60

// JSON's escapes make a missing newline visible; the tail, since most misses are at the end.
const show = (text: string): string =>
  `\`${JSON.stringify(text.length > SHOWN_CHARS ? `…${text.slice(-SHOWN_CHARS)}` : text)}\``

const who = (scope: ProgramScope): string => (scope.program === undefined ? 'Your program' : `\`${scope.program}\``)

/** The first condition of `match` that `text` fails, in words; null when it meets them all. */
function textMiss(text: string, match: TextMatch): string | null {
  if (match.equals !== undefined && text !== match.equals) {
    return `not ${show(match.equals)}`
  }
  if (match.notEquals !== undefined && text === match.notEquals) {
    return 'which is what it must not be'
  }
  if (match.contains !== undefined && !text.includes(match.contains)) {
    return `${show(match.contains)} isn't in it`
  }
  if (match.notContains !== undefined && text.includes(match.notContains)) {
    return `${show(match.notContains)} is still in it`
  }
  if (match.endsWith !== undefined && !text.endsWith(match.endsWith)) {
    return `it doesn't end in ${show(match.endsWith)}`
  }
  return null
}

function exitMiss(subject: string, exit: ProcessExit | undefined, status: number): string | null {
  if (exitedWith(exit, status)) {
    return null
  }
  if (exit === undefined) {
    return `${subject} was still running.`
  }
  return exit.signal === undefined
    ? `${subject} exited with status ${exit.code}, not ${status}.`
    : `${subject} was killed by signal ${exit.signal}.`
}

/**
 * What the Machine saw in place of an unmet declared check, as one sentence for the player. It
 * states the observation, never the fix. Null for a check that is met or has nothing to show.
 */
export function observedFor(check: ObjectiveCheck, { events, builds }: CheckInput): string | null {
  if (check.kind === 'build-fixed') {
    if (!builds?.failedEarlier) {
      return 'No build has failed with an error yet.'
    }
    return builds.latestErrors > 0 ? `The latest build still stops with ${builds.latestErrors} error(s).` : null
  }
  const scope: ProgramScope = 'program' in check ? check : {}
  const subject = who(scope)
  // The last one: the run the player just watched.
  const pid = judgedProcesses(events, scope).at(-1)
  if (pid === undefined) {
    return scope.program === undefined
      ? 'No program of yours ran in that command.'
      : `${subject} didn't run in that command.`
  }
  switch (check.kind) {
    case 'compiles':
      return null
    case 'exit-status':
      return exitMiss(subject, exitOf(events, pid), check.status)
    case 'wrote': {
      const writes = writesTo(events, pid, check.fd)
      if (writes.length === 0) {
        return `${subject} wrote nothing to fd ${check.fd}.`
      }
      if (!writes.some(isWholeWrite)) {
        return `The kernel took only part of what ${subject} wrote to fd ${check.fd}.`
      }
      const text = writtenTo(events, pid, check.fd)
      const miss = check.text ? textMiss(text, check.text) : null
      return miss && `${subject} wrote ${show(text)} to fd ${check.fd}: ${miss}.`
    }
    case 'terminal': {
      const text = terminalOf(events, pid)
      const miss = textMiss(text, check.text)
      return miss && `The terminal got ${show(text)}: ${miss}.`
    }
    case 'syscall': {
      const call = callsOf(events, pid, check.names).at(-1)
      const names = check.names.map((name) => `\`${name}\``).join(' or ')
      if (!call) {
        return `${subject} never called ${names}.`
      }
      return call.exit ? `\`${call.enter.name}\` returned ${call.exit.ret}.` : `\`${call.enter.name}\` hasn't returned.`
    }
    case 'no-zombies-after': {
      const children = forkedChildren(events, pid)
      const reaped = children.filter((child) => child.reapedSeq !== null).length
      return `${subject} forked ${children.length} children and waited for ${reaped}.`
    }
    case 'ran': {
      const args = argvOf(events, pid, check.program)?.slice(1)
      if (check.args && args) {
        return `${subject} ran with ${args.length === 0 ? 'no arguments' : show(args.join(' '))}.`
      }
      return check.status === undefined ? null : exitMiss(subject, exitOf(events, pid), check.status)
    }
    case 'read-to-end': {
      const reads = readsOf(events, pid, check.path)
      if (reads.length === 0) {
        return `${subject} never opened \`${check.path}\`.`
      }
      const whole = reads.filter((read) => read.reachedEnd)
      if (whole.length === 0) {
        return `${subject} stopped reading \`${check.path}\` before its end.`
      }
      const text = whole.at(-1)?.text ?? ''
      const miss = check.text ? textMiss(text, check.text) : null
      return miss && `${subject} read ${show(text)}: ${miss}.`
    }
  }
}
