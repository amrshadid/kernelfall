import type { FieldGuideEntry } from '@kernelfall/game/types'
import { describe, expect, it } from 'vitest'
import { cardForSyscall, fieldGuideSections } from './field-guide.util'

const CARDS = [
  { id: 'write-syscall', term: 'write(2)' },
  { id: 'getdents', term: 'reading a folder (getdents64)' },
  { id: 'process', term: 'process' },
]

const SLOTS = [
  { number: 'P.1', title: 'Power On' },
  { number: 'P.2', title: 'First Words' },
  { number: 'S.1', title: 'The Streets of Userland' },
]

const ENTRIES: readonly FieldGuideEntry[] = [
  {
    name: 'ls',
    kind: 'command',
    what: 'list a folder',
    syscalls: ['openat', 'getdents64', 'write'],
    syscallNote: '-l: a statx per entry',
    firstMet: 'P.1',
    deepenedIn: ['S.1', '2.7'],
  },
  { name: '/etc', kind: 'folder', what: 'system settings', syscalls: [], firstMet: 'P.1', deepenedIn: ['S.2'] },
  {
    name: 'echo',
    kind: 'command',
    what: 'print its arguments',
    syscalls: ['write'],
    firstMet: 'P.1',
    deepenedIn: ['P.2'],
  },
]

describe('cardForSyscall', () => {
  it('finds the card named after the syscall or naming it in brackets', () => {
    expect(cardForSyscall(CARDS, 'write')?.id).toBe('write-syscall')
    expect(cardForSyscall(CARDS, 'getdents64')?.id).toBe('getdents')
    expect(cardForSyscall(CARDS, 'openat')).toBeUndefined()
  })

  it('does not take a card whose name only starts the same', () => {
    expect(cardForSyscall([{ id: 'w', term: 'writev(2)' }], 'write')).toBeUndefined()
  })
})

describe('fieldGuideSections', () => {
  const [commands, folders] = fieldGuideSections(ENTRIES, CARDS, SLOTS)

  it('lists commands, then folders, in the guide order', () => {
    expect(commands?.rows.map((row) => row.name)).toEqual(['ls', 'echo'])
    expect(folders?.rows.map((row) => row.name)).toEqual(['/etc'])
  })

  it('links the syscalls that have a card found, and names the levels', () => {
    expect(commands?.rows[0]).toEqual({
      name: 'ls',
      what: 'list a folder',
      syscalls: [
        { text: 'openat', href: null },
        { text: 'getdents64', href: '#/codex/getdents' },
        { text: 'write', href: '#/codex/write-syscall' },
      ],
      syscallNote: '-l: a statx per entry',
      firstMet: 'P.1 Power On',
      deepenedIn: ['S.1 The Streets of Userland', '2.7'],
    })
  })

  it('leaves out a part with no entries', () => {
    expect(fieldGuideSections(ENTRIES.slice(0, 1), CARDS, SLOTS).map((s) => s.title)).toEqual(['Commands'])
  })
})
