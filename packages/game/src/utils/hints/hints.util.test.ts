import { describe, expect, it } from 'vitest'
import { HINT_COSTS, LEVEL_BASE_SCORE } from '#types/definitions/hints'
import { hintPenalty, isHintOffered, nextHintTier, revealedHintTiers, scoreWithHints } from '#utils/hints/hints.util'

describe('hints', () => {
  it('has init offer a hint only after three failed runs', () => {
    expect([0, 2, 3, 5].map(isHintOffered)).toEqual([false, false, true, true])
  })

  it('reveals nudge, then concept, then the spot, then nothing', () => {
    expect([0, 1, 2, 3].map(nextHintTier)).toEqual(['nudge', 'concept', 'spot', null])
    expect(revealedHintTiers(2)).toEqual(['nudge', 'concept'])
  })

  it('charges each revealed hint against the level score', () => {
    expect(hintPenalty(0)).toBe(0)
    expect(hintPenalty(2)).toBe(HINT_COSTS.nudge + HINT_COSTS.concept)
    expect(scoreWithHints(0)).toBe(LEVEL_BASE_SCORE)
    expect(scoreWithHints(3)).toBe(LEVEL_BASE_SCORE - HINT_COSTS.nudge - HINT_COSTS.concept - HINT_COSTS.spot)
  })
})
