import { describe, expect, it } from 'vitest'
import { errnoMessage } from './errno-text.util'
import { code, lowerFirst, shownText } from './narration-text.util'

describe('code', () => {
  it('marks a term for the code face', () => {
    expect(code('write()')).toBe('`write()`')
    expect(code(1)).toBe('`1`')
  })
})

describe('shownText', () => {
  it('drops one trailing newline and keeps the others visible as escapes', () => {
    expect(shownText('a\tb\nc\n')).toBe('a\\tb\\nc')
  })

  it('cuts text longer than a line', () => {
    expect(shownText('x'.repeat(50))).toBe(`${'x'.repeat(40)}…`)
  })
})

describe('lowerFirst', () => {
  it('lowers only the first letter', () => {
    expect(lowerFirst('Writes your bytes')).toBe('writes your bytes')
  })
})

describe('errnoMessage', () => {
  it("is strerror()'s text, lowercased to sit in a sentence", () => {
    expect(errnoMessage('ENOENT')).toBe('no such file or directory')
  })

  it('says only that it failed for an errno without a text', () => {
    expect(errnoMessage(null)).toBe('it failed')
    expect(errnoMessage('ENOTANERRNO')).toBe('it failed')
  })
})
