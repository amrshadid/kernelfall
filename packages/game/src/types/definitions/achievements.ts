import type { GameContent } from '#types/definitions/content'
import type { Progress } from '#types/definitions/progress'

export interface AchievementContext {
  readonly progress: Progress
  readonly content: GameContent
}

/** A declarative achievement: earned as soon as `isEarned` holds for the progress. */
export interface Achievement {
  readonly id: string
  readonly title: string
  readonly description: string
  /** Must be pure: it is re-evaluated after every progress update. */
  isEarned(context: AchievementContext): boolean
}
