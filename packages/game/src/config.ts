import type { StorageAdapter } from '@kernelfall/core/types'
import type { GameConfig, GameOptions } from '#types/definitions/config'
import { DEFAULT_GAME_OPTIONS } from '#types/definitions/config'
import type { GameContent } from '#types/definitions/content'
import type { EpochMs } from '#types/definitions/progress'

let _storage: StorageAdapter | null = null
let _content: GameContent | null = null
let _options: GameOptions = DEFAULT_GAME_OPTIONS

/** Once at startup. Options left out keep their defaults. */
export function configureGame(config: GameConfig) {
  const { storage, content, ...options } = config
  _storage = storage
  _content = content
  _options = { ...DEFAULT_GAME_OPTIONS, ...options }
}

export function getStorage(): StorageAdapter {
  if (!_storage) {
    throw new Error('[@kernelfall/game] Not configured. Call configureGame() at app startup.')
  }
  return _storage
}

export function getContent(): GameContent {
  if (!_content) {
    throw new Error('[@kernelfall/game] Not configured. Call configureGame() at app startup.')
  }
  return _content
}

export function getGameConfig(): GameOptions {
  return _options
}

/** Timestamps come from the configured clock, so tests control them. */
export function getGameNow(): EpochMs {
  return _options.clock.now()
}

export function resetGameConfig() {
  _storage = null
  _content = null
  _options = DEFAULT_GAME_OPTIONS
}
