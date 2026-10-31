import { describe, expect, it } from 'vitest'
import { errnoMessage } from './errno-text.util'

describe('errnoMessage', () => {
  it("gives strerror()'s text, lowercased to sit inside a sentence", () => {
    expect(errnoMessage('ENOENT')).toBe('no such file or directory')
    expect(errnoMessage('EBADF')).toBe('bad file descriptor')
  })

  it('falls back to a plain phrase for an unknown errno or none', () => {
    expect(errnoMessage('ENOTANERRNO')).toBe('it failed')
    expect(errnoMessage(null)).toBe('it failed')
  })
})
