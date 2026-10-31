import { describe, expect, it } from 'vitest'
import { firstLine, fitText } from './drawing-text.util'

describe('fitText', () => {
  it('keeps text that fits and cuts longer text to the limit, ellipsis included', () => {
    expect(fitText('write', 8)).toBe('write')
    expect(fitText('getdents64', 8)).toBe('getdent…')
    expect(fitText('getdents64', 8)).toHaveLength(8)
  })
})

describe('firstLine', () => {
  it('takes the first line of output, without its newline', () => {
    expect(firstLine('hello\nworld\n')).toBe('hello')
    expect(firstLine('hello\n')).toBe('hello')
    expect(firstLine('')).toBe('')
  })
})
