/** init's three hint steps, always revealed in this order (docs/GAME.md §6). */
export const HINT_TIERS = ['nudge', 'concept', 'spot'] as const

export type HintTier = (typeof HINT_TIERS)[number]

// PROVISIONAL: tune after the first playtests.
/** init offers a hint once this many runs have failed. */
export const HINT_OFFER_AFTER_ATTEMPTS = 3

export interface RevealedHint {
  readonly tier: HintTier
  readonly text: string
}

// PROVISIONAL: the score is a separate meter from Taint and never changes the ending.
// Tune after the first playtests. These are the defaults of `GameOptions`.
export const LEVEL_BASE_SCORE = 100
export const HINT_COSTS = { nudge: 10, concept: 20, spot: 30 } as const
