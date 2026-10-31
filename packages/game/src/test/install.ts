import type { StorageAdapter } from '@kernelfall/core/types'
import { configureGame, resetGameConfig } from '#config'
import { cleanupGameListeners, setupGameListeners } from '#events/listeners'
import { settleSaves } from '#services/utils/save-queue.service'
import { useProgressStore } from '#store/progress.store'
import { exampleContent } from '#test/example-level'
import { FakeClock } from '#test/fake-clock'
import { createMemoryStorage, type MemoryStorage } from '#test/memory-storage'
import type { GameOptions } from '#types/definitions/config'
import type { GameContent } from '#types/definitions/content'

export interface TestGameOptions<S extends StorageAdapter> {
  /** Storage to start from, e.g. to reopen a game saved by an earlier install. */
  readonly storage?: S
  readonly clock?: FakeClock
  /** Overrides for the game's options, including the content to play. */
  readonly options?: Partial<GameOptions> & { readonly content?: GameContent }
}

export interface TestGame<S extends StorageAdapter> {
  readonly storage: S
  readonly clock: FakeClock
}

/**
 * Configures the game with in-memory storage, the example content and a fake
 * clock, sets up its listeners and empties the progress store: a fresh, closed game.
 */
export function installTestGame<S extends StorageAdapter = MemoryStorage>(
  options: TestGameOptions<S> = {}
): TestGame<S> {
  const storage = options.storage ?? (createMemoryStorage() as StorageAdapter as S)
  const clock = options.clock ?? new FakeClock()
  configureGame({ storage, content: exampleContent(), clock, ...options.options })
  setupGameListeners()
  useProgressStore.getState().reset()
  return { storage, clock }
}

/** Lets queued writes land, then stops the listeners and forgets the configuration. */
export async function uninstallTestGame(): Promise<void> {
  await settleSaves()
  cleanupGameListeners()
  resetGameConfig()
}
