import type { AchievementUnlockedPayload, GAME_EVENTS, HintRevealedPayload, LevelCompletedPayload } from '#events/types'
import type { Achievement } from '#types/definitions/achievements'
import type { GameOptions } from '#types/definitions/config'
import type { GameContent } from '#types/definitions/content'
import type { EpochMs, LevelResult, Progress } from '#types/definitions/progress'
import type { LevelRunEvent, LevelRunState } from '#types/definitions/runner'
import type { ActiveLevel } from '#types/definitions/store'

// PROVISIONAL: a longer gap between two actions counts as this much play time,
// so a tab left open overnight doesn't inflate "time spent". The default of `GameOptions`.
export const ACTIVE_TIME_IDLE_CAP_MS = 2 * 60 * 1000

/** Wall-clock time for timestamps. The default is `{ now: () => Date.now() }`. */
export interface WallClock {
  now(): EpochMs
}

export interface DispatchResult {
  readonly run: LevelRunState
  /** False when the event didn't apply in the current state; nothing was saved. */
  readonly changed: boolean
  /** Achievements unlocked by this event, for a toast. */
  readonly unlocked: readonly Achievement[]
}

export interface ActiveLevelStepInput {
  readonly progress: Progress
  readonly active: ActiveLevel
  readonly event: LevelRunEvent
  readonly options: GameOptions
  readonly content: GameContent
  readonly now: EpochMs
  /** Play time to count before the step, or null while no play time is being counted. */
  readonly activeMs: number | null
}

export interface ActiveLevelStep {
  readonly after: LevelRunState
  readonly progress: Progress
  readonly unlocked: readonly Achievement[]
}

export interface RunStepEmissionsInput {
  readonly before: LevelRunState
  readonly after: LevelRunState
  readonly unlocked: readonly Achievement[]
  /** The level's result in the progress after the step. */
  readonly lastResult: LevelResult | null
  readonly at: EpochMs
}

/** A game event a level-loop step announces, in the order it is emitted. */
export type RunStepEmission =
  | { readonly name: typeof GAME_EVENTS.HINT_REVEALED; readonly payload: HintRevealedPayload }
  | { readonly name: typeof GAME_EVENTS.LEVEL_COMPLETED; readonly payload: LevelCompletedPayload }
  | { readonly name: typeof GAME_EVENTS.ACHIEVEMENT_UNLOCKED; readonly payload: AchievementUnlockedPayload }
