import type { LevelId } from '@kernelfall/game/types'

export const STEP_WORD_BUDGETS: Readonly<Record<string, number>> = {
  scene: 80,
  'see-it': 200,
  'build-it': 150,
  'watch-it': 120,
  debrief: 50,
}

export const STORY_WORD_BUDGET = { min: 500, max: 650 } as const

export const CODEX_WORD_BUDGETS = { simple: 25, deep: 80 } as const

export const ASIDE_BUDGET = 0

// Game internals and hedges: matched case-insensitively, as whole words.
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

// Rewritten to the standard: their budgets fail the tests; the others only warn.
export const ENFORCED_LEVELS: readonly LevelId[] = [
  'prologue-boot-path-01-power-on',
  'prologue-boot-path-02-first-words',
  'prologue-boot-path-03-speak-to-shell',
  'prologue-boot-path-04-the-boot-path',
  'prologue-machine-in-section-05-kernel-up-close',
  'prologue-machine-in-section-06-finding-the-hardware',
  'prologue-machine-in-section-07-who-runs',
  'prologue-machine-in-section-08-pages-and-maps',
]
