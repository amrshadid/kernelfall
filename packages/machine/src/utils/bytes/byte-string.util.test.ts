import { describe, expect, it } from 'vitest'
import { byteString } from '#utils/bytes/byte-string.util'

describe('byteString', () => {
  it('keeps one character per byte, so any byte survives', () => {
    const bytes = Uint8Array.from([0x2f, 0x74, 0x6d, 0x70, 0xc3, 0xa9, 0xff, 0x01])
    const text = byteString(bytes)
    expect(text).toHaveLength(bytes.length)
    expect(Uint8Array.from(text, (c) => c.charCodeAt(0))).toEqual(bytes)
  })

  it('leaves ASCII readable', () => {
    expect(byteString(Uint8Array.from([0x2f, 0x62, 0x69, 0x6e]))).toBe('/bin')
  })
})
