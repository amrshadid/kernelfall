import type { LevelId } from '@kernelfall/game/types'

/** The most words each story step may have, by section slug, in play order. */
export const STEP_WORD_BUDGETS: Readonly<Record<string, number>> = {
  scene: 80,
  'see-it': 200,
  'build-it': 150,
  'watch-it': 120,
  debrief: 50,
}

/** The whole story, its five steps together. */
export const STORY_WORD_BUDGET = { min: 500, max: 650 } as const

export const CODEX_WORD_BUDGETS = { simple: 25, deep: 80 } as const

/** Parenthetical asides allowed in a level's steps. */
export const ASIDE_BUDGET = 0

/** Game internals and hedges that never belong in a level's text; matched case-insensitively, as whole words. */
export const BANNED_PHRASES: readonly string[] = [
  'the game',
  'emulator',
  'X-ray reads',
  'trace reader',
  'control shell',
  'virtio share',
  'your numbers will differ',
  'your numbers may differ',
  'yours will differ',
  'next release',
  'tomorrow',
]

/** Levels rewritten to the standard: their budgets fail the tests; every other level only warns. */
export const ENFORCED_LEVELS: readonly LevelId[] = []
