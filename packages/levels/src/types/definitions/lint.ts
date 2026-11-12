import type { LevelId } from '@kernelfall/game/types'

export interface StepWords {
  readonly section: string
  readonly words: number
  readonly budget: number
}

export interface CardWords {
  readonly cardId: string
  readonly simple: number
  readonly deep: number
}

/** A picture word with one meaning (docs/LEVELS.md, "Vocabulary"). */
export interface VocabularyRule {
  readonly word: string
  readonly means: string
  readonly pattern: RegExp
  /** The only ways to write it; anything else is flagged. */
  readonly allowed?: RegExp
  /** Level id prefixes that may use it freely. */
  readonly only?: readonly string[]
}

export interface BannedUse {
  readonly phrase: string
  readonly section: string
}

export interface LevelLint {
  readonly levelId: LevelId
  readonly concepts: number
  readonly steps: readonly StepWords[]
  readonly storyWords: number
  readonly asides: number
  readonly banned: readonly BannedUse[]
  readonly cards: readonly CardWords[]
  readonly problems: readonly string[]
}
