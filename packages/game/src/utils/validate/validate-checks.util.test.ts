import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL_YAML, EXAMPLE_LOCATION } from '#test/index'
import { MAX_EXIT_STATUS } from '#types/definitions/checks'
import { validateLevel } from '#utils/validate/validate-level.util'

// The checks are read as part of a level.yaml, so they are tested through validateLevel().

// Linux's errno values (include/uapi/asm-generic/errno-base.h), written out so the test doesn't trust the lab's table.
const EAGAIN = 11
const ENOENT = 2

const TEXT_FIELDS = 'equals, notEquals, contains, notContains, endsWith'

const [firstObjective, secondObjective] = EXAMPLE_LEVEL_YAML.objectives
const [firstRule] = EXAMPLE_LEVEL_YAML.taint

/** The example level with `check` on its first objective. */
const withObjectiveCheck = (check: unknown) => ({
  ...EXAMPLE_LEVEL_YAML,
  objectives: [{ ...firstObjective, check }, secondObjective],
})

/** The example level with `check` on its Taint rule. */
const withTaintCheck = (check: unknown) => ({ ...EXAMPLE_LEVEL_YAML, taint: [{ ...firstRule, check }] })

function errorsFor(input: unknown): readonly string[] {
  const result = validateLevel(input, EXAMPLE_LOCATION)
  return result.ok ? [] : result.errors
}

/** The objective check as read, or a thrown list of what was wrong with it. */
function objectiveCheck(check: unknown) {
  const result = validateLevel(withObjectiveCheck(check), EXAMPLE_LOCATION)
  if (!result.ok) {
    throw new Error(result.errors.join('\n'))
  }
  return result.value.objectives[0]?.check
}

const objectiveErrors = (check: unknown) => errorsFor(withObjectiveCheck(check))

describe('objective checks', () => {
  it('leaves the check out when the level gives none: its own checker reports the objective', () => {
    const result = validateLevel(EXAMPLE_LEVEL_YAML, EXAMPLE_LOCATION)
    expect(result.ok && result.value.objectives[0]).not.toHaveProperty('check')
  })

  it('reads the build checks, which take no fields', () => {
    expect(objectiveCheck({ kind: 'compiles' })).toEqual({ kind: 'compiles' })
    expect(objectiveCheck({ kind: 'build-fixed' })).toEqual({ kind: 'build-fixed' })
    expect(objectiveErrors({ kind: 'compiles', status: 0 })).toEqual([
      'objectives[0].check.status: unknown field (expected one of: kind)',
    ])
  })

  it('reads exit-status within the 8 bits a process leaves behind, scoped to a program if named', () => {
    expect(objectiveCheck({ kind: 'exit-status', status: 0 })).toEqual({ kind: 'exit-status', status: 0 })
    expect(objectiveCheck({ kind: 'exit-status', status: MAX_EXIT_STATUS, program: 'ls' })).toEqual({
      kind: 'exit-status',
      status: MAX_EXIT_STATUS,
      program: 'ls',
    })
    expect(objectiveErrors({ kind: 'exit-status', status: MAX_EXIT_STATUS + 1 })).toEqual([
      `objectives[0].check.status: expected a number from 0 to ${MAX_EXIT_STATUS}, got ${MAX_EXIT_STATUS + 1}`,
    ])
  })

  it('names a program by its file name, never a path', () => {
    expect(objectiveErrors({ kind: 'exit-status', status: 0, program: '/bin/ls' })).toEqual([
      'objectives[0].check.program: expected a program name like ls, got "/bin/ls"',
    ])
  })

  it('reads wrote with or without a text match', () => {
    expect(objectiveCheck({ kind: 'wrote', fd: 1 })).toEqual({ kind: 'wrote', fd: 1 })
    expect(objectiveCheck({ kind: 'wrote', fd: 1, text: { equals: 'hello\n' } })).toEqual({
      kind: 'wrote',
      fd: 1,
      text: { equals: 'hello\n' },
    })
    expect(objectiveErrors({ kind: 'wrote', fd: -1 })).toEqual([
      'objectives[0].check.fd: expected a number from 0 to 9007199254740991, got -1',
    ])
  })

  it('reads terminal, which needs a text match', () => {
    expect(objectiveCheck({ kind: 'terminal', text: { contains: 'bin', endsWith: '$ ' } })).toEqual({
      kind: 'terminal',
      text: { contains: 'bin', endsWith: '$ ' },
    })
    expect(objectiveErrors({ kind: 'terminal' })).toEqual([
      'objectives[0].check.text: expected an object, got nothing',
      `objectives[0].check.text: expected at least one of ${TEXT_FIELDS}`,
    ])
  })

  describe('text match', () => {
    const terminal = (text: unknown) => ({ kind: 'terminal', text })

    it('needs at least one condition', () => {
      expect(objectiveErrors(terminal({}))).toEqual([
        `objectives[0].check.text: expected at least one of ${TEXT_FIELDS}`,
      ])
    })

    it('compares text as is, so a lone newline is a valid match', () => {
      expect(objectiveCheck(terminal({ endsWith: '\n' }))).toEqual(terminal({ endsWith: '\n' }))
    })

    it('reads the conditions that must not hold', () => {
      expect(objectiveCheck(terminal({ notEquals: 'hello\n', notContains: 'quiet' }))).toEqual(
        terminal({ notEquals: 'hello\n', notContains: 'quiet' })
      )
    })

    it('reports text that is not a string, and unknown conditions', () => {
      expect(objectiveErrors(terminal({ contains: 3, startsWith: '$' }))).toEqual([
        `objectives[0].check.text.startsWith: unknown field (expected one of: ${TEXT_FIELDS})`,
        'objectives[0].check.text.contains: expected text, got a number',
      ])
    })
  })

  describe('ran', () => {
    it('reads the program, its arguments and its exit status', () => {
      expect(
        objectiveCheck({ kind: 'ran', program: 'ls', args: { min: 1, match: ['^-[a-z]{2,}$'] }, status: 0 })
      ).toEqual({ kind: 'ran', program: 'ls', args: { min: 1, match: ['^-[a-z]{2,}$'] }, status: 0 })
      expect(objectiveCheck({ kind: 'ran', program: 'echo' })).toEqual({ kind: 'ran', program: 'echo' })
    })

    it('reports empty argument conditions and a pattern that is not a regular expression', () => {
      expect(objectiveErrors({ kind: 'ran', args: {} })).toEqual([
        'objectives[0].check.args: expected at least one of min, match',
      ])
      expect(objectiveErrors({ kind: 'ran', args: { match: ['(-l'] } })).toEqual([
        'objectives[0].check.args.match[0]: expected a regular expression, got "(-l"',
      ])
    })
  })

  describe('read-to-end', () => {
    it('reads an absolute path, with a text match if given', () => {
      expect(objectiveCheck({ kind: 'read-to-end', path: '/etc/motd', program: 'cat' })).toEqual({
        kind: 'read-to-end',
        path: '/etc/motd',
        program: 'cat',
      })
      expect(objectiveCheck({ kind: 'read-to-end', path: '/proc/cmdline', text: { notContains: 'quiet' } })).toEqual({
        kind: 'read-to-end',
        path: '/proc/cmdline',
        text: { notContains: 'quiet' },
      })
    })

    it('names a file from the root, as the check compares it with the path passed', () => {
      expect(objectiveErrors({ kind: 'read-to-end', path: 'motd' })).toEqual([
        'objectives[0].check.path: expected an absolute path like /etc/motd, got "motd"',
      ])
    })
  })

  describe('syscall', () => {
    it('reads the names, and a success as ret', () => {
      expect(objectiveCheck({ kind: 'syscall', names: ['openat', 'exit_group'], ret: 0 })).toEqual({
        kind: 'syscall',
        names: ['openat', 'exit_group'],
        ret: 0,
      })
    })

    it('reads a failure by its errno name, like a man page', () => {
      expect(objectiveCheck({ kind: 'syscall', names: ['read'], errno: 'EAGAIN' })).toMatchObject({ errno: EAGAIN })
      expect(objectiveCheck({ kind: 'syscall', names: ['openat'], errno: 'ENOENT' })).toMatchObject({ errno: ENOENT })
    })

    it('reports an errno name the kernel does not have', () => {
      expect(objectiveErrors({ kind: 'syscall', names: ['read'], errno: 'EWHOOPS' })).toEqual([
        'objectives[0].check.errno: expected an errno name like EAGAIN, got "EWHOOPS"',
      ])
    })

    it('takes ret or errno, not both: a call either succeeds or fails', () => {
      expect(objectiveErrors({ kind: 'syscall', names: ['read'], ret: 0, errno: 'EAGAIN' })).toEqual([
        'objectives[0].check.errno: give ret (a success) or errno (a failure), not both',
      ])
    })

    it('needs at least one syscall, named as the syscall table names it', () => {
      expect(objectiveErrors({ kind: 'syscall', names: [] })).toEqual([
        'objectives[0].check.names: expected at least one syscall',
      ])
      expect(objectiveErrors({ kind: 'syscall', names: ['OpenAt'] })).toEqual([
        'objectives[0].check.names[0]: expected a syscall name like openat, got "OpenAt"',
      ])
    })
  })

  it('reads no-zombies-after with at least one command', () => {
    expect(objectiveCheck({ kind: 'no-zombies-after', commands: 2, program: 'ksh' })).toEqual({
      kind: 'no-zombies-after',
      commands: 2,
      program: 'ksh',
    })
    expect(objectiveErrors({ kind: 'no-zombies-after', commands: 0 })).toEqual([
      'objectives[0].check.commands: expected a number from 1 to 9007199254740991, got 0',
    ])
  })

  it('reports an unknown kind with the kinds there are', () => {
    expect(objectiveErrors({ kind: 'prints' })).toEqual([
      'objectives[0].check.kind: expected one of compiles, build-fixed, exit-status, wrote, terminal, syscall, no-zombies-after, ran, read-to-end, got "prints"',
    ])
  })

  it('reports a field another kind has, with the path to it', () => {
    expect(objectiveErrors({ kind: 'terminal', text: { equals: '' }, fd: 1 })).toEqual([
      'objectives[0].check.fd: unknown field (expected one of: kind, text, program)',
    ])
  })
})

describe('Taint checks', () => {
  function taintCheck(check: unknown) {
    const result = validateLevel(withTaintCheck(check), EXAMPLE_LOCATION)
    if (!result.ok) {
      throw new Error(result.errors.join('\n'))
    }
    return result.value.taint[0]?.check
  }

  const taintErrors = (check: unknown) => errorsFor(withTaintCheck(check))

  it('reads unreaped-children, scoped to a program if named', () => {
    expect(taintCheck({ kind: 'unreaped-children' })).toEqual({ kind: 'unreaped-children' })
    expect(taintCheck({ kind: 'unreaped-children', program: 'ksh' })).toEqual({
      kind: 'unreaped-children',
      program: 'ksh',
    })
  })

  it('reads ran-program, which needs at least one program name', () => {
    expect(taintCheck({ kind: 'ran-program', programs: ['sh', 'bash'] })).toEqual({
      kind: 'ran-program',
      programs: ['sh', 'bash'],
    })
    expect(taintErrors({ kind: 'ran-program', programs: [] })).toEqual([
      'taint[0].check.programs: expected at least one program',
    ])
    expect(taintErrors({ kind: 'ran-program', programs: ['/bin/sh'] })).toEqual([
      'taint[0].check.programs[0]: expected a program name like ls, got "/bin/sh"',
    ])
  })

  it('reports unknown kinds and fields', () => {
    expect(taintErrors({ kind: 'leaked-fd' })).toEqual([
      'taint[0].check.kind: expected one of unreaped-children, ran-program, got "leaked-fd"',
    ])
    expect(taintErrors({ kind: 'unreaped-children', programs: ['sh'] })).toEqual([
      'taint[0].check.programs: unknown field (expected one of: kind, program)',
    ])
  })
})
