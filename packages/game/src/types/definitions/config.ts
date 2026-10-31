import type { StorageAdapter } from '@kernelfall/core/types'
import type { Achievement } from '#types/definitions/achievements'
import type { GameContent } from '#types/definitions/content'
import type { HintTier } from '#types/definitions/hints'
import { HINT_COSTS, LEVEL_BASE_SCORE } from '#types/definitions/hints'
import type { SaveSlot } from '#types/definitions/saves'
import { DEFAULT_SAVE_SLOT } from '#types/definitions/saves'
import type { WallClock } from '#types/definitions/session'
import { ACTIVE_TIME_IDLE_CAP_MS } from '#types/definitions/session'
import { CLEAN_REBOOT_MAX_TAINT, MAX_LEVEL_TAINT, UNSTABLE_REBOOT_MAX_TAINT } from '#types/definitions/taint'

/** The game's options; each one has a default, so the app passes only what it changes. */
export interface GameOptions {
  readonly clock: WallClock
  readonly slot: SaveSlot
  /** Defaults to the built-in `ACHIEVEMENTS`. */
  readonly achievements: readonly Achievement[] | undefined
  /** Save after every change that matters (level events, imports). Off only in tests. */
  readonly autosave: boolean
  /** A longer gap between two actions counts as this much play time. */
  readonly activeTimeIdleCapMs: number
  /** Score for passing a level with no hint revealed. */
  readonly levelBaseScore: number
  /** Score each hint tier costs once revealed. */
  readonly hintCosts: Readonly<Record<HintTier, number>>
  /** The most Act II Taint that still earns the clean reboot. */
  readonly cleanRebootMaxTaint: number
  /** The most Act II Taint that still earns the unstable reboot; above it the Dangling survives. */
  readonly unstableRebootMaxTaint: number
  /** A single level adds at most this much Taint. */
  readonly maxLevelTaint: number
}

/** What the app passes to `configureGame()` at startup. */
export interface GameConfig extends Partial<GameOptions> {
  /** Where saves are kept (localStorage on the web). */
  readonly storage: StorageAdapter
  /** The validated levels and skill tree. */
  readonly content: GameContent
}

/** The scoring and Taint numbers the pure rules need; hooks pass `getGameConfig()`. */
export type GameTuning = Pick<
  GameOptions,
  'levelBaseScore' | 'hintCosts' | 'cleanRebootMaxTaint' | 'unstableRebootMaxTaint' | 'maxLevelTaint'
>

export const DEFAULT_GAME_TUNING: GameTuning = {
  levelBaseScore: LEVEL_BASE_SCORE,
  hintCosts: HINT_COSTS,
  cleanRebootMaxTaint: CLEAN_REBOOT_MAX_TAINT,
  unstableRebootMaxTaint: UNSTABLE_REBOOT_MAX_TAINT,
  maxLevelTaint: MAX_LEVEL_TAINT,
}

export const DEFAULT_GAME_OPTIONS: GameOptions = {
  ...DEFAULT_GAME_TUNING,
  clock: { now: () => Date.now() },
  slot: DEFAULT_SAVE_SLOT,
  achievements: undefined,
  autosave: true,
  activeTimeIdleCapMs: ACTIVE_TIME_IDLE_CAP_MS,
}
