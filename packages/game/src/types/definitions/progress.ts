import type { LevelDefinition, LevelId } from '#types/definitions/level'
import type { CompletionVia, LevelPhase, LevelRunState, RunCheckpoint } from '#types/definitions/runner'
import type { TaintLedger } from '#types/definitions/taint'

/** Milliseconds since the Unix epoch, from the injected clock. */
export type EpochMs = number

/** How one completion of a level went. */
export interface LevelResult {
  readonly via: CompletionVia
  readonly score: number
  /** Taint points of this completion. */
  readonly taint: number
  readonly hintsRevealed: number
  readonly attempts: number
  readonly oopses: number
}

/** Everything saved about one level the player has started. */
export interface LevelProgress {
  readonly levelId: LevelId
  readonly firstStartedAt: EpochMs
  /** First completion; replays don't move it. */
  readonly completedAt: EpochMs | null
  /** Active play time, excluding idle gaps. */
  readonly activeMs: number
  /** Checker runs over all play-throughs. */
  readonly attempts: number
  readonly oopses: number
  /** The play-through in progress, or `null` when none is. */
  readonly run: RunCheckpoint | null
  readonly lastResult: LevelResult | null
  readonly best: LevelResult | null
  /** The player's code, by file path. Opaque to the game. */
  readonly code: Readonly<Record<string, string>>
  /**
   * The player's own code, kept while `code` holds init's version (after
   * "Continue with init's version"), so it can be restored. Opaque to the game.
   */
  readonly playerCode?: Readonly<Record<string, string>>
  /** Key of a lab snapshot the web app stores elsewhere. Opaque to the game. */
  readonly labSnapshot: string | null
}

export interface UnlockedAchievement {
  readonly id: string
  readonly unlockedAt: EpochMs
}

/** Where "Continue" on the title screen takes the player. */
export interface LastActive {
  readonly levelId: LevelId
  readonly phase: LevelPhase
}

/** The player's whole progress. Plain JSON-safe data. */
export interface Progress {
  /** In the order the levels were first started. */
  readonly levels: readonly LevelProgress[]
  /** Level ids in the order they were first completed. */
  readonly completionOrder: readonly LevelId[]
  readonly taint: TaintLedger
  readonly achievements: readonly UnlockedAchievement[]
  readonly lastActive: LastActive | null
}

/** Status of a level on the map and the progress screen. */
export type LevelStatus = 'locked' | 'available' | 'in_progress' | 'completed'

/** One level-loop transition, as folded into the progress by applyRunStep(). */
export interface RunStep {
  readonly level: LevelDefinition
  readonly before: LevelRunState
  readonly after: LevelRunState
  readonly now: EpochMs
}
