import type { HintTier } from '@kernelfall/game/types'

/** How the Guide names each hint tier: "Hint 1, a nudge". */
export const HINT_TIER_NAMES: Readonly<Record<HintTier, string>> = {
  nudge: 'a nudge',
  concept: 'the concept',
  spot: 'the spot',
}

/** A Codex term that is a man page, like `fork(2)`: the Guide links it under See also. */
export const MAN_PAGE = /^\S+\(\d\)$/

/** A chip that is a whole command line (`ls /bin`), not a bare tool name (`wc`). */
export const WHOLE_LINE = /\s/

/** init's word when a run meets every objective but adds Taint. */
export const HELD_PASS_LINE =
  'It works, every objective is met. But the run added Taint, listed above. Fix it and run again to finish clean, or continue as is and keep the Taint.'

/** The Guide's note while building; a level without a checker says init's version finishes it. */
export const BUILD_NOTES = {
  checked: 'Objectives tick on their own each time your program runs; there is no Submit button.',
  unchecked:
    "Objectives tick on their own each time your program runs; there is no Submit button. This level's checker isn't wired up yet, so for now init's version finishes it.",
} as const
