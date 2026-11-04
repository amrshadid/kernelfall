import type { LevelId } from '@kernelfall/game/types'

/** One story step's prose words against its budget. */
export interface StepWords {
  readonly section: string
  readonly words: number
  readonly budget: number
}

/** A Codex card's Simple and Deep words. */
export interface CardWords {
  readonly cardId: string
  readonly simple: number
  readonly deep: number
}

/** A banned phrase where a level uses it. */
export interface BannedUse {
  readonly phrase: string
  readonly section: string
}

/** A level measured against the content budgets (docs/LEVELS.md#concepts-and-budgets). */
export interface LevelLint {
  readonly levelId: LevelId
  readonly concepts: number
  readonly steps: readonly StepWords[]
  readonly storyWords: number
  readonly asides: number
  readonly banned: readonly BannedUse[]
  readonly cards: readonly CardWords[]
  /** Every budget the level breaks, in words; empty when it keeps them all. */
  readonly problems: readonly string[]
}
