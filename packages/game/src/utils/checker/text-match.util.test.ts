import { describe, expect, it } from 'vitest'
import { matchesText } from '#utils/checker/text-match.util'

describe('matchesText', () => {
  it('holds only when every condition given holds', () => {
    expect(matchesText('a b\n', { equals: 'a b\n' })).toBe(true)
    expect(matchesText('hello\n', { contains: 'ell', endsWith: '\n' })).toBe(true)
    expect(matchesText('hello', { contains: 'ell', endsWith: '\n' })).toBe(false)
    expect(matchesText('hello', { equals: 'hell' })).toBe(false)
  })

  it('holds the negative conditions too', () => {
    expect(matchesText('hi\n', { notEquals: 'hello\n' })).toBe(true)
    expect(matchesText('hello\n', { notEquals: 'hello\n' })).toBe(false)
    expect(matchesText('ro initcall_debug\n', { contains: 'initcall_debug', notContains: 'quiet' })).toBe(true)
    expect(matchesText('ro quiet initcall_debug\n', { contains: 'initcall_debug', notContains: 'quiet' })).toBe(false)
  })
})
