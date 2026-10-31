import { describe, expect, it } from 'vitest'
import { STEPS } from './steps.constants'
import { stepIndexOf, stepLabelOf } from './steps.util'

describe('stepIndexOf', () => {
  it('places each phase on the rail, with oops at Build it', () => {
    expect(stepIndexOf('scene')).toBe(0)
    expect(stepIndexOf('oops')).toBe(2)
    expect(stepIndexOf('card')).toBe(4)
    expect(stepIndexOf('complete')).toBe(STEPS.length)
    expect(stepLabelOf('complete')).toBe('Done')
  })
})
