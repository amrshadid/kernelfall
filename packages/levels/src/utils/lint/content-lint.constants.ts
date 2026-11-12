import type { LevelId } from '@kernelfall/game/types'
import type { VocabularyRule } from '#types/index'

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
  // Pictures that collided with the Section drawing.
  'the Deep',
  'the Smith',
  'waiting room',
  'tap on the shoulder',
  'house',
  'houses',
]

// One meaning per picture word, so "floor" is never a kernel part and "door" never the Gate.
export const VOCABULARY: readonly VocabularyRule[] = [
  {
    word: 'floor',
    means: "one of the drawing's three: Userland, the kernel, hardware",
    pattern: /\bfloors?\b/gi,
    allowed: /\b(three|hardware|kernel's|Userland's) floors?\b/gi,
  },
  {
    word: 'door',
    means: 'a device file',
    pattern: /\bdoors?\b/gi,
    allowed: /Files, Doors and Wires/g,
    only: ['prologue-machine-in-section-09-'],
  },
  // Lower case only: "the Gate" is the name.
  { word: 'gate', means: 'written "the Gate": the line every system call crosses', pattern: /\bgates?\b/g },
  {
    word: 'lock',
    means: "a file's permissions",
    pattern: /\b(pad)?lock(s|ed)?\b/gi,
    only: ['prologue-surface-survey-'],
  },
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
  'prologue-machine-in-section-09-files-doors-wires',
  'prologue-machine-in-section-10-bring-it-up',
  'prologue-surface-survey-01-streets',
  'prologue-surface-survey-02-who-may-enter',
  'prologue-surface-survey-03-processes',
  'prologue-surface-survey-04-finding-things',
  'prologue-surface-survey-05-text-tools',
  'act1-process-district-04-run-anything',
]
