import type { ServiceResponse } from '@kernelfall/core/types'
import { useMemo } from 'react'
import { getGameNow } from '#config'
import { useAnnounceProgress } from '#hooks/saves/useAnnounceProgress.hook'
import { useProgressStore } from '#store/progress.store'
import type { LevelId } from '#types/definitions/level'
import type { PlacementResult } from '#types/definitions/placement'
import { placeLevels } from '#utils/progress/index'

const SOURCE = 'game/placement'

export interface UsePlacementActionsResult {
  /** Completes the levels a finished placement check placed the player past, and saves; resolves with their ids. */
  readonly place: (result: PlacementResult) => Promise<ServiceResponse<readonly LevelId[]>>
}

/** Applies a placement check's result to the progress. Judging the tasks is `judgePlacement()`'s. */
export function usePlacementActions(): UsePlacementActionsResult {
  const { announceProgress } = useAnnounceProgress()

  return useMemo(
    () => ({
      place: async ({ placed }) => {
        const store = useProgressStore.getState()
        store.setProgress(placeLevels(store.progress, placed, getGameNow()))
        await announceProgress(SOURCE)
        return { success: true, data: placed }
      },
    }),
    [announceProgress]
  )
}
