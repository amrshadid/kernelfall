import type { LevelProgress, Progress } from '@kernelfall/game/types'
import { DEFAULT_GAME_TUNING } from '@kernelfall/game/types'
import { continueTarget, emptyProgress, kernelMap } from '@kernelfall/game/utils'
import type { LoadedContent } from '@kernelfall/levels/types'
import { CONTENT_FILES, loadContent } from '@kernelfall/levels/utils'
import type { MapNode } from '@shared/types'
import { mapNodes } from '@shared/utils/map'

/** The real level content, as the app loads it. */
export function realContent(): LoadedContent {
  const loaded = loadContent(CONTENT_FILES)
  if (!loaded.ok) {
    throw new Error(loaded.errors.join('\n'))
  }
  return loaded.value
}

/** Progress with these levels finished through init's version, in order. */
export function doneWithHelp(...levelIds: readonly string[]): Progress {
  const levels = levelIds.map(
    (levelId): LevelProgress => ({
      levelId,
      firstStartedAt: 0,
      completedAt: 1,
      activeMs: 0,
      attempts: 0,
      oopses: 0,
      run: null,
      lastResult: null,
      best: { via: 'reference', score: 0, taint: 0, hintsRevealed: 3, attempts: 0, oopses: 0 },
      code: {},
      labSnapshot: null,
    })
  )
  return { ...emptyProgress(), levels, completionOrder: [...levelIds] }
}

/** The built levels of these regions (`prologue/boot-path`), in play order. */
export function levelIdsIn(loaded: LoadedContent, ...regionKeys: readonly string[]): readonly string[] {
  return loaded.game.levels
    .filter((level) => regionKeys.includes(`${level.act}/${level.region}`))
    .map((level) => level.id)
}

/** The map's stops for this progress, with "you are here" where Continue goes. */
export function nodesFor(progress: Progress, loaded: LoadedContent = realContent()): readonly MapNode[] {
  const map = kernelMap(progress, loaded.game, DEFAULT_GAME_TUNING)
  return mapNodes(loaded, map, continueTarget(progress, loaded.game)?.levelId ?? null)
}
