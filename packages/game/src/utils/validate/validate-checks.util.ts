import type { StringRule } from '@kernelfall/core/types'
import type { ObjectReader } from '@kernelfall/core/utils'
import { ERRNO_TABLE } from '@kernelfall/machine/types'
import type { ArgsMatch, ObjectiveCheck, ProgramScope, TaintCheck, TextMatch } from '#types/definitions/checks'
import {
  ABSOLUTE_PATH_PATTERN,
  MAX_EXIT_STATUS,
  OBJECTIVE_CHECK_KINDS,
  PROGRAM_NAME_PATTERN,
  SYSCALL_NAME_PATTERN,
  TAINT_CHECK_KINDS,
} from '#types/definitions/checks'

const TEXT_MATCH_FIELDS = ['equals', 'notEquals', 'contains', 'notContains', 'endsWith'] as const
const ARGS_MATCH_FIELDS = ['min', 'match'] as const

const SYSCALL_NAME: StringRule = { pattern: SYSCALL_NAME_PATTERN, expected: 'a syscall name like openat' }
const PROGRAM_NAME: StringRule = { pattern: PROGRAM_NAME_PATTERN, expected: 'a program name like ls' }
const ABSOLUTE_PATH: StringRule = { pattern: ABSOLUTE_PATH_PATTERN, expected: 'an absolute path like /etc/motd' }

/** errno by name (`EAGAIN` → 11), so `level.yaml` reads like a man page. */
const ERRNO_BY_NAME: ReadonlyMap<string, number> = new Map(
  [...ERRNO_TABLE].map(([errno, info]) => [info.name, errno] as const)
)

/** The fields every check of `kind` may have. */
const fieldsOf = (...fields: readonly string[]): readonly string[] => ['kind', ...fields]

function readProgram(check: ObjectReader): ProgramScope {
  return check.has('program') ? { program: check.string('program', PROGRAM_NAME) } : {}
}

function readTextMatch(match: ObjectReader): TextMatch {
  match.rejectUnknownKeys(TEXT_MATCH_FIELDS)
  const given = TEXT_MATCH_FIELDS.filter((field) => match.has(field))
  if (given.length === 0) {
    match.issues.add(match.path, `expected at least one of ${TEXT_MATCH_FIELDS.join(', ')}`)
  }
  return Object.fromEntries(given.map((field) => [field, match.text(field)]))
}

function readArgsMatch(match: ObjectReader): ArgsMatch {
  match.rejectUnknownKeys(ARGS_MATCH_FIELDS)
  if (!ARGS_MATCH_FIELDS.some((field) => match.has(field))) {
    match.issues.add(match.path, `expected at least one of ${ARGS_MATCH_FIELDS.join(', ')}`)
  }
  const patterns = match.has('match') ? match.stringList('match') : undefined
  patterns?.forEach((pattern, index) => {
    try {
      new RegExp(pattern)
    } catch {
      match.issues.add(`${match.pathOf('match')}[${index}]`, `expected a regular expression, got "${pattern}"`)
    }
  })
  return {
    ...(match.has('min') ? { min: match.integer('min', 1) } : {}),
    ...(patterns === undefined ? {} : { match: patterns }),
  }
}

function readErrno(check: ObjectReader): number {
  const name = check.string('errno')
  const errno = ERRNO_BY_NAME.get(name)
  if (errno === undefined) {
    check.issues.add(check.pathOf('errno'), `expected an errno name like EAGAIN, got "${name}"`)
    return 0
  }
  return errno
}

function readSyscallCheck(check: ObjectReader): ObjectiveCheck {
  check.rejectUnknownKeys(fieldsOf('names', 'ret', 'errno', 'program'))
  const names = check.stringList('names', SYSCALL_NAME)
  if (names.length === 0) {
    check.issues.add(check.pathOf('names'), 'expected at least one syscall')
  }
  if (check.has('ret') && check.has('errno')) {
    check.issues.add(check.pathOf('errno'), 'give ret (a success) or errno (a failure), not both')
  }
  return {
    kind: 'syscall',
    names,
    ...(check.has('ret') ? { ret: check.integer('ret', 0) } : {}),
    ...(check.has('errno') ? { errno: readErrno(check) } : {}),
    ...readProgram(check),
  }
}

/** Reads an objective's `check:` block (types/definitions/checks.ts lists the kinds). */
export function readObjectiveCheck(check: ObjectReader): ObjectiveCheck {
  const kind = check.oneOf('kind', OBJECTIVE_CHECK_KINDS)
  switch (kind) {
    case 'compiles':
    case 'build-fixed':
      check.rejectUnknownKeys(fieldsOf())
      return { kind }
    case 'exit-status':
      check.rejectUnknownKeys(fieldsOf('status', 'program'))
      return { kind, status: check.integer('status', 0, MAX_EXIT_STATUS), ...readProgram(check) }
    case 'wrote':
      check.rejectUnknownKeys(fieldsOf('fd', 'text', 'program'))
      return {
        kind,
        fd: check.integer('fd', 0),
        ...(check.has('text') ? { text: readTextMatch(check.object('text')) } : {}),
        ...readProgram(check),
      }
    case 'terminal':
      check.rejectUnknownKeys(fieldsOf('text', 'program'))
      return { kind, text: readTextMatch(check.object('text')), ...readProgram(check) }
    case 'syscall':
      return readSyscallCheck(check)
    case 'no-zombies-after':
      check.rejectUnknownKeys(fieldsOf('commands', 'program'))
      return { kind, commands: check.integer('commands', 1), ...readProgram(check) }
    case 'ran':
      check.rejectUnknownKeys(fieldsOf('args', 'status', 'program'))
      return {
        kind,
        ...(check.has('args') ? { args: readArgsMatch(check.object('args')) } : {}),
        ...(check.has('status') ? { status: check.integer('status', 0, MAX_EXIT_STATUS) } : {}),
        ...readProgram(check),
      }
    case 'read-to-end':
      check.rejectUnknownKeys(fieldsOf('path', 'text', 'program'))
      return {
        kind,
        path: check.string('path', ABSOLUTE_PATH),
        ...(check.has('text') ? { text: readTextMatch(check.object('text')) } : {}),
        ...readProgram(check),
      }
  }
}

/** Reads a Taint rule's `check:` block. */
export function readTaintCheck(check: ObjectReader): TaintCheck {
  const kind = check.oneOf('kind', TAINT_CHECK_KINDS)
  switch (kind) {
    case 'unreaped-children':
      check.rejectUnknownKeys(fieldsOf('program'))
      return { kind, ...readProgram(check) }
    case 'ran-program': {
      check.rejectUnknownKeys(fieldsOf('programs', 'program'))
      const programs = check.stringList('programs', PROGRAM_NAME)
      if (programs.length === 0) {
        check.issues.add(check.pathOf('programs'), 'expected at least one program')
      }
      return { kind, programs, ...readProgram(check) }
    }
  }
}
