import { describe, expect, it } from 'vitest'
import { stepStates } from './step-rail.util'

describe('stepStates', () => {
  it('fills the steps before the current one', () => {
    expect(stepStates(5, 2)).toEqual(['done', 'done', 'current', 'future', 'future'])
  })

  it('marks every step done once the level is finished', () => {
    expect(stepStates(3, 3)).toEqual(['done', 'done', 'done'])
  })
})
