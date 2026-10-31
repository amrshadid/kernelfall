import type { Act } from '#types/definitions/level'
import type { Ending } from '#types/definitions/taint'

export interface CompletionStats {
  readonly completed: number
  readonly total: number
  /** Whole percent, 0–100. */
  readonly percent: number
}

export interface ActSummary extends CompletionStats {
  readonly act: Act
  readonly taint: number
}

/** Everything the progress screen shows. */
export interface ProgressSummary {
  readonly overall: CompletionStats
  /** Only acts that have levels, in story order. */
  readonly acts: readonly ActSummary[]
  readonly skills: CompletionStats
  readonly codexCards: number
  readonly achievements: number
  readonly totalTaint: number
  readonly activeMs: number
  /** The ending the current Taint total would give. */
  readonly projectedEnding: Ending
}
