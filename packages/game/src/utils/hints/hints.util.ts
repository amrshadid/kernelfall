import type { GameTuning } from '#types/definitions/config'
import { DEFAULT_GAME_TUNING } from '#types/definitions/config'
import type { HintTier } from '#types/definitions/hints'
import { HINT_OFFER_AFTER_ATTEMPTS, HINT_TIERS } from '#types/definitions/hints'

/** Whether init offers a hint, after enough failed runs. */
export function isHintOffered(attempts: number): boolean {
  return attempts >= HINT_OFFER_AFTER_ATTEMPTS
}

/** The tier revealed next, given how many are already shown; `null` once all are. */
export function nextHintTier(revealed: number): HintTier | null {
  return HINT_TIERS[revealed] ?? null
}

export function revealedHintTiers(revealed: number): readonly HintTier[] {
  return HINT_TIERS.slice(0, revealed)
}

/** Total score cost of the first `revealed` hints. */
export function hintPenalty(revealed: number, tuning: GameTuning = DEFAULT_GAME_TUNING): number {
  return revealedHintTiers(revealed).reduce((sum, tier) => sum + tuning.hintCosts[tier], 0)
}

/** The score for passing a level yourself after revealing `revealed` hints. */
export function scoreWithHints(revealed: number, tuning: GameTuning = DEFAULT_GAME_TUNING): number {
  return Math.max(0, tuning.levelBaseScore - hintPenalty(revealed, tuning))
}
