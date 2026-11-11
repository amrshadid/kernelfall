import { describe, expect, it } from 'vitest'
import { shellSession } from '#test/index'
import type { CheckInput } from '#types/definitions/checker'
import type { ObjectiveCheck } from '#types/definitions/checks'
import { meetsObjectiveCheck } from '#utils/checker/objective-checks.util'
import { observedFor } from '#utils/checker/observed.util'

const session: CheckInput = { events: shellSession() }
const seen = (check: ObjectiveCheck, input = session) => observedFor(check, input)

describe('observedFor', () => {
  it('says nothing ran when no judged process did', () => {
    expect(seen({ kind: 'exit-status', status: 0 }, { events: [] })).toBe('No program of yours ran in that command.')
    expect(seen({ kind: 'exit-status', status: 0, program: 'cat' })).toBe("`cat` didn't run in that command.")
  })

  it('exit-status: the status it left', () => {
    expect(seen({ kind: 'exit-status', status: 1 })).toBe('Your program exited with status 0, not 1.')
  })

  it('wrote: nothing on the fd, or the bytes and the condition they miss', () => {
    expect(seen({ kind: 'wrote', fd: 2 })).toBe('Your program wrote nothing to fd 2.')
    expect(seen({ kind: 'wrote', fd: 1, program: 'ls', text: { endsWith: '\n\n' } })).toBe(
      '`ls` wrote `"bin\\n"` to fd 1: it doesn\'t end in `"\\n\\n"`.'
    )
    expect(seen({ kind: 'wrote', fd: 1, program: 'ls', text: { contains: 'etc' } })).toBe(
      '`ls` wrote `"bin\\n"` to fd 1: `"etc"` isn\'t in it.'
    )
  })

  it('terminal: what reached it', () => {
    expect(seen({ kind: 'terminal', program: 'ls', text: { equals: 'etc\n' } })).toBe(
      'The terminal got `"bin\\n"`: not `"etc\\n"`.'
    )
  })

  it('syscall: never called, or what the last call returned', () => {
    expect(seen({ kind: 'syscall', names: ['read', 'readv'] })).toBe('Your program never called `read` or `readv`.')
    expect(seen({ kind: 'syscall', names: ['openat'], ret: 3 })).toBe('`openat` returned -2.')
  })

  it('read-to-end: a file never opened', () => {
    expect(seen({ kind: 'read-to-end', path: '/proc/cmdline', program: 'ls' })).toBe(
      '`ls` never opened `/proc/cmdline`.'
    )
  })

  it('build-fixed: no failed build yet, or errors left', () => {
    expect(seen({ kind: 'build-fixed' })).toBe('No build has failed with an error yet.')
    const builds = { failedEarlier: true, latestErrors: 2 }
    expect(seen({ kind: 'build-fixed' }, { events: [], builds })).toBe('The latest build still stops with 2 error(s).')
  })

  it('has nothing to say about a check that is met', () => {
    const met: ObjectiveCheck[] = [
      { kind: 'compiles' },
      { kind: 'exit-status', status: 0 },
      { kind: 'wrote', fd: 1, program: 'ls', text: { equals: 'bin\n' } },
    ]
    for (const check of met) {
      expect(meetsObjectiveCheck(check, session)).toBe(true)
      expect(seen(check), check.kind).toBeNull()
    }
  })
})
