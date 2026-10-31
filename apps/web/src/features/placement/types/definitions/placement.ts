import type { LevelId } from '@kernelfall/game/types'

export type PlacementStep = 'offer' | 'tasks' | 'result'

export interface PlacementRow {
  readonly levelId: LevelId
  /** The level it stands for, as the map names it: `P.5 The Kernel Up Close`. */
  readonly level: string
  readonly task: string
  readonly files: readonly string[]
  /** Objectives met so far, of all the task lists. */
  readonly met: number
  readonly of: number
  readonly passed: boolean
}

/** Where the check leaves the player, in words. */
export interface PlacementSummary {
  /** The levels placed past, by name. */
  readonly placed: readonly string[]
  /** The level to play next, by name; null when every task passed. */
  readonly sendTo: string | null
}
