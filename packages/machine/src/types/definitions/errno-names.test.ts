import { describe, expect, it } from 'vitest'
import { EBADF, EFAULT, EINVAL, ENOSYS } from '#types/definitions/errno'
import { ERRNO_TABLE } from '#types/definitions/errno-names'

describe('ERRNO_TABLE', () => {
  it.each([
    [EBADF, 'EBADF', 'Bad file descriptor'],
    [EFAULT, 'EFAULT', 'Bad address'],
    [EINVAL, 'EINVAL', 'Invalid argument'],
    [ENOSYS, 'ENOSYS', 'Function not implemented'],
  ])('names errno %i like Linux and glibc', (errno, name, message) => {
    expect(ERRNO_TABLE.get(errno)).toEqual({ name, message })
  })

  it('has a unique name for every number', () => {
    const names = [...ERRNO_TABLE.values()].map((e) => e.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
