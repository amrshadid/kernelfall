import type { LevelDefinition } from '#types/definitions/level'
import type { LevelRunState } from '#types/definitions/runner'

/** Whether the player's save has been loaded into the progress store. */
export const GAME_STATUS = {
  closed: 'closed',
  opening: 'opening',
  open: 'open',
} as const

export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS]

/** The level being played and its play-through. */
export interface ActiveLevel {
  readonly level: LevelDefinition
  readonly run: LevelRunState
}
