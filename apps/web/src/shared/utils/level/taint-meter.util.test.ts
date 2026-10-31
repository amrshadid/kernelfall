import { TAINT_SEGMENTS } from '@shared/constants/ui'
import { describe, expect, it } from 'vitest'
import { filledSegments, taintLabel } from './taint-meter.util'

describe('filledSegments', () => {
  it('is empty for a clean level', () => {
    expect(filledSegments(0)).toBe(0)
  })

  it('shows any Taint at all, even one point', () => {
    expect(filledSegments(1)).toBe(1)
    expect(filledSegments(3)).toBe(2)
  })

  it('never draws more segments than the meter has', () => {
    expect(filledSegments(40)).toBe(TAINT_SEGMENTS)
  })
})

describe('taintLabel', () => {
  it('names a clean level and counts points otherwise', () => {
    expect(taintLabel(0)).toBe('clean')
    expect(taintLabel(1)).toBe('1 point')
    expect(taintLabel(4)).toBe('4 points')
  })
})
