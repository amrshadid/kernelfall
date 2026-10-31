import type { Act, LevelId } from '#types/definitions/level'

/** One small task of a placement check, standing for one level of its region. */
export interface PlacementTask {
  /** The level it places the player past. */
  readonly levelId: LevelId
  /** What init asks, in plain words. */
  readonly task: string
  /** The level's starter files the task opens in the editor; none for a task done in the shell. */
  readonly files: readonly string[]
  /** Ids of the level's own objectives, judged by the level's own checker; all must be met. */
  readonly objectives: readonly string[]
}

/**
 * A region's placement check, offered at the region's edge: a player who
 * already knows its levels shows it with a few tasks instead of playing them. A
 * passed task places the player past its level; a failed one sends them to just
 * that level. Never timed, no Taint, retaken any time.
 */
export interface PlacementCheck {
  /** init's offer at the edge of the region. */
  readonly offer: string
  /** About how long it takes, shown with the offer. */
  readonly minutes: number
  /** In play order. */
  readonly tasks: readonly PlacementTask[]
}

/** A task as `placement.yaml` lists it: its level by folder, not by id. */
export interface PlacementTaskFile extends Omit<PlacementTask, 'levelId'> {
  /** The level's folder in the region, e.g. `05-kernel-up-close`. */
  readonly level: string
}

/** What a region's `placement.yaml` holds. */
export interface PlacementFile extends Omit<PlacementCheck, 'tasks'> {
  readonly tasks: readonly PlacementTaskFile[]
}

/** The objectives met so far in a placement check, by the level of each task. */
export type PlacementProgress = ReadonlyMap<LevelId, ReadonlySet<string>>

/** Where a finished placement check leaves the player. */
export interface PlacementResult {
  /** The levels of the tasks passed, in play order: they are placed. */
  readonly placed: readonly LevelId[]
  /** The level of the first task failed, where the player goes next; null if every task passed. */
  readonly sendTo: LevelId | null
}

/** A region with a placement check, where init offers it. */
export interface PlacementOffer {
  readonly act: Act
  readonly regionId: string
  readonly regionName: string
  readonly check: PlacementCheck
}
