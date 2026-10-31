import type { LevelDefinition, LevelId, SkillId } from '#types/definitions/level'
import type { LevelProgress, LevelStatus } from '#types/definitions/progress'

/** One level as the Kernel Map shows it. */
export interface KernelMapLevel {
  readonly level: LevelDefinition
  readonly status: LevelStatus
  /** The player's record for the level, or undefined if never started. */
  readonly record: LevelProgress | undefined
  /** Taint of the level's latest completion (capped per level); 0 if never completed. */
  readonly taint: number
  readonly isPlayable: boolean
}

/** Every level with its status, record and Taint, for the Kernel Map. */
export interface KernelMap {
  /** Every level, in play order. */
  readonly levels: readonly KernelMapLevel[]
  /** Lookup by level id, for the slots of the map's outline. */
  readonly byId: ReadonlyMap<LevelId, KernelMapLevel>
  /** Skills the player has unlocked by completing levels. */
  readonly unlockedSkills: ReadonlySet<SkillId>
}
