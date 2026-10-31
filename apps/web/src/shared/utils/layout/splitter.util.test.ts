import { describe, expect, it } from 'vitest'
import { clampSize, draggedSize, keyedSize } from './splitter.util'

const LIMITS = { min: 15, max: 34 }

describe('draggedSize', () => {
  it('grows a left panel when dragged right, in the size unit', () => {
    expect(draggedSize(20, 32, 16, 1, LIMITS)).toBe(22)
  })

  it('grows a right panel when dragged left', () => {
    expect(draggedSize(20, -32, 16, -1, LIMITS)).toBe(22)
  })

  it('never passes the limits', () => {
    expect(draggedSize(20, 10_000, 16, 1, LIMITS)).toBe(34)
    expect(draggedSize(20, -10_000, 16, 1, LIMITS)).toBe(15)
  })
})

describe('keyedSize', () => {
  it('moves the divider a step with the arrows, the same way as dragging', () => {
    expect(keyedSize(20, 'ArrowRight', 1, 1, LIMITS)).toBe(21)
    expect(keyedSize(20, 'ArrowLeft', 1, 1, LIMITS)).toBe(19)
    expect(keyedSize(20, 'ArrowLeft', 1, -1, LIMITS)).toBe(21)
  })

  it('jumps to the limits with Home and End, and ignores other keys', () => {
    expect(keyedSize(20, 'Home', 1, 1, LIMITS)).toBe(15)
    expect(keyedSize(20, 'End', 1, 1, LIMITS)).toBe(34)
    expect(keyedSize(20, 'a', 1, 1, LIMITS)).toBeNull()
  })
})

describe('clampSize', () => {
  it('rounds to two decimals inside the limits', () => {
    expect(clampSize(20.123_456, LIMITS)).toBe(20.12)
  })
})
