import { describe, expect, it } from 'vitest'
import { plainText } from '#utils/terminal/plain-text.util'

const ESC = String.fromCharCode(0x1b)

describe('plainText', () => {
  it("drops ls's colour codes and keeps the names", () => {
    expect(plainText(`${ESC}[1;34mbin${ESC}[m    ${ESC}[0;0mmotd${ESC}[m\n`)).toBe('bin    motd\n')
  })

  it("drops bash's bracketed-paste switch", () => {
    expect(plainText(`a b\r\n${ESC}[?2004h`)).toBe('a b\r\n')
  })
})
