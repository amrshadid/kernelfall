import { describe, expect, it } from 'vitest'
import { syscallName, syscallNumber } from '#utils/vm-trace/syscall-name.util'

describe('syscall names', () => {
  it('names a tracepoint as strace does, and numbers it through that name', () => {
    expect(syscallName('newuname')).toBe('uname')
    expect(syscallName('mmap_pgoff')).toBe('mmap2')
    expect(syscallName('read')).toBe('read')
    expect(syscallNumber('newuname')).toBe(122)
    expect(syscallNumber('mmap_pgoff')).toBe(192)
    expect(syscallNumber('nosuch')).toBe(-1)
  })
})
