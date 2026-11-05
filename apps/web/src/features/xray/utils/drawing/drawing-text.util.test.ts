import { describe, expect, it } from 'vitest'
import { firstLine, fitText, wrapText } from './drawing-text.util'

const NO_BREAK = String.fromCharCode(0xa0)

describe('fitText', () => {
  it('keeps text that fits and cuts longer text to the limit, ellipsis included', () => {
    expect(fitText('write', 8)).toBe('write')
    expect(fitText('getdents64', 8)).toBe('getdent…')
    expect(fitText('getdents64', 8)).toHaveLength(8)
  })
})

describe('wrapText', () => {
  it('breaks between words, each line within the limit, never at a no-break space', () => {
    expect(wrapText('write 19 bytes to fd 1 (your terminal)', 21, 3)).toEqual([
      'write 19 bytes to fd',
      '1 (your terminal)',
    ])
    const kept = (text: string) => text.replaceAll('~', NO_BREAK)
    expect(wrapText(kept('write 19~bytes to fd~1 (your terminal)'), 21, 3)).toEqual([
      kept('write 19~bytes to'),
      kept('fd~1 (your terminal)'),
    ])
  })

  it('cuts what is left over with an ellipsis on the last line', () => {
    const lines = wrapText("Reads a file's details: type, size, owner, permissions, times", 21, 2)
    expect(lines).toEqual(["Reads a file's", 'details: type, size,…'])
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(21)
    }
  })

  it('cuts a word longer than a line', () => {
    expect(wrapText('/usr/lib/gcc/i586-alpine-linux-musl', 10, 2)).toEqual(['/usr/lib/…'])
  })
})

describe('firstLine', () => {
  it('takes the first line of output, without its newline', () => {
    expect(firstLine('hello\nworld\n')).toBe('hello')
    expect(firstLine('hello\n')).toBe('hello')
    expect(firstLine('')).toBe('')
  })
})
