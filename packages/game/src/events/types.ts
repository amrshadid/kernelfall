import type { HintTier } from '#types/definitions/hints'
import type { LevelId } from '#types/definitions/level'
import type { EpochMs } from '#types/definitions/progress'
import type { CompletionVia } from '#types/definitions/runner'
import type { SaveIssue } from '#types/definitions/saves'

export const GAME_EVENTS = {
  OPENED: 'GAME_OPENED',
  PROGRESS_CHANGED: 'GAME_PROGRESS_CHANGED',
  LEVEL_STARTED: 'GAME_LEVEL_STARTED',
  LEVEL_COMPLETED: 'GAME_LEVEL_COMPLETED',
  HINT_REVEALED: 'GAME_HINT_REVEALED',
  ACHIEVEMENT_UNLOCKED: 'GAME_ACHIEVEMENT_UNLOCKED',
  SAVED: 'GAME_SAVED',
  SAVE_FAILED: 'GAME_SAVE_FAILED',
  PROGRESS_RESET: 'GAME_PROGRESS_RESET',
  CODE_REPLACED: 'GAME_CODE_REPLACED',
} as const

/** The level's code was swapped from outside the editor: init's version loaded, or the player's restored. */
export interface CodeReplacedPayload {
  levelId: LevelId
  files: Readonly<Record<string, string>>
  /** Whose code it is now. */
  owner: 'reference' | 'player'
  at: EpochMs
}

export interface OpenedPayload {
  /** Null when the stored save was used as is; otherwise why it wasn't. */
  saveIssue: SaveIssue | null
  at: EpochMs
}

/** Progress changed in a way worth keeping; the autosave listener writes it. */
export interface ProgressChangedPayload {
  at: EpochMs
}

export interface LevelStartedPayload {
  levelId: LevelId
  /** True when a saved play-through was resumed. */
  resumed: boolean
  at: EpochMs
}

export interface LevelCompletedPayload {
  levelId: LevelId
  via: CompletionVia
  score: number
  taint: number
  at: EpochMs
}

export interface HintRevealedPayload {
  levelId: LevelId
  tier: HintTier
  at: EpochMs
}

export interface AchievementUnlockedPayload {
  achievementId: string
  title: string
  at: EpochMs
}

export interface SavedPayload {
  at: EpochMs
}

export interface SaveFailedPayload {
  issue: SaveIssue
  at: EpochMs
}

export interface ProgressResetPayload {
  at: EpochMs
}
