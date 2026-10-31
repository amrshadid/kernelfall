import type { LevelChecker, LevelCheckers } from '#types/definitions/checker'
import type { FieldGuide } from '#types/definitions/field-guide'
import type { LevelDefinition, LevelId } from '#types/definitions/level'
import type { ActOutline } from '#types/definitions/outline'
import type { SkillNode } from '#types/definitions/skills'

export interface GameContentParts {
  readonly acts: readonly ActOutline[]
  /** In any order; the outline puts them in play order. */
  readonly levels: readonly LevelDefinition[]
  readonly skills: readonly SkillNode[]
  /** Levels that have a `checker.ts`, by level id. */
  readonly checkers?: LevelCheckers
  readonly fieldGuide?: FieldGuide
}

/** Every part checked against the others once at startup. */
export interface GameContent {
  readonly acts: readonly ActOutline[]
  /** In play order. */
  readonly levels: readonly LevelDefinition[]
  readonly skills: readonly SkillNode[]
  /** Null for content without one. */
  readonly fieldGuide: FieldGuide | null
  level(id: LevelId): LevelDefinition | undefined
  /** Declared checks plus `checker.ts`; undefined if the level has neither (only init's version finishes it). */
  checker(id: LevelId): LevelChecker | undefined
}
