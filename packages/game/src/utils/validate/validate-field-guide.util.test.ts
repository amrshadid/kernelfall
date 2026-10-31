import { describe, expect, it } from 'vitest'
import { validateFieldGuide } from '#utils/validate/validate-field-guide.util'

const LS = {
  name: 'ls',
  kind: 'command',
  what: 'list a folder',
  syscalls: ['openat', 'getdents64', 'write'],
  syscallNote: '-l: a statx per entry',
  firstMet: 'P.1',
  deepenedIn: ['S.1', '2.7'],
}

describe('validateFieldGuide', () => {
  it('reads the page and its entries, a folder without syscalls or later levels', () => {
    const tmp = { name: '/tmp', kind: 'folder', what: 'scratch space anyone may write', firstMet: 'S.1' }

    expect(validateFieldGuide({ opensAt: 'P.3', entries: [LS, tmp] })).toEqual({
      ok: true,
      value: { opensAt: 'P.3', entries: [LS, { ...tmp, syscalls: [], deepenedIn: [] }] },
    })
  })

  it('reports an unknown kind, a syscall that is not a kernel name, a repeated entry and unknown fields', () => {
    const result = validateFieldGuide({
      opensAt: 'P.3',
      entries: [
        { ...LS, kind: 'tool', syscalls: ['openAt'] },
        { ...LS, level: 'P.1' },
      ],
    })

    expect(result.ok ? [] : result.errors).toEqual([
      'entries[0].kind: expected one of command, folder, got "tool"',
      'entries[0].syscalls[0]: expected a syscall name like openat, got "openAt"',
      'entries[1].level: unknown field (expected one of: name, kind, what, syscalls, syscallNote, firstMet, deepenedIn)',
      'entries: "ls" appears more than once',
    ])
  })
})
