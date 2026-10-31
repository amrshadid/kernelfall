import type { CheckVerdict } from '#types/definitions/checker'
import type { LevelId } from '#types/definitions/level'
import type { TaintEvent } from '#types/definitions/taint'

/**
 * Steps of the level loop (docs/GAME.md §6). `oops` is the pause after the
 * player's code crashed the kernel, before the lab is restored.
 */
export const LEVEL_PHASES = ['scene', 'see', 'build', 'oops', 'watch', 'card', 'complete'] as const

/**
 * `reference`: the player continued with the reference version (never a dead end).
 * `placement`: a placement check placed the player past the level, unplayed.
 */
export const COMPLETION_VIAS = ['player', 'reference', 'placement'] as const

export type LevelPhase = (typeof LEVEL_PHASES)[number]

/** The oops as the lab printed it, in the real format. */
export interface OopsReport {
  readonly text: string
}

export type LevelRunEvent =
  | { readonly type: 'next' }
  | { readonly type: 'reveal_hint' }
  | { readonly type: 'submit'; readonly verdict: CheckVerdict }
  | { readonly type: 'oops'; readonly report: OopsReport }
  | { readonly type: 'respawn' }
  | { readonly type: 'use_reference' }
  /** "Continue as is": finish with the held pass and its Taint. */
  | { readonly type: 'accept_taint' }
  /** "Fix it first": drop the held pass and keep building; the next passing run replaces it. */
  | { readonly type: 'fix_first' }

export type LevelRunEventType = LevelRunEvent['type']

export type CompletionVia = (typeof COMPLETION_VIAS)[number]

export interface LevelOutcome {
  readonly via: CompletionVia
  readonly taint: readonly TaintEvent[]
  readonly hintsRevealed: number
  readonly score: number
}

export interface RunCheckpoint {
  readonly phase: LevelPhase
  readonly hintsRevealed: number
  readonly attempts: number
  readonly oopses: number
}

/** One play-through of a level. Changes only through `transition`. */
export interface LevelRunState {
  readonly levelId: LevelId
  readonly phase: LevelPhase
  readonly hintsRevealed: number
  /** Checker runs in this play-through. */
  readonly attempts: number
  readonly oopses: number
  readonly lastVerdict: CheckVerdict | null
  readonly oops: OopsReport | null
  readonly outcome: LevelOutcome | null
  /**
   * A run met every objective but added Taint: the level waits in "build it"
   * until the player fixes it or continues as is. Not saved; a resumed run asks again on the next pass.
   */
  readonly heldPass: LevelOutcome | null
}
