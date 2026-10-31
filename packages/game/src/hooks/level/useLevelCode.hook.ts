import { eventBus } from '@kernelfall/core/services'
import type { ServiceResponse } from '@kernelfall/core/types'
import { useMemo } from 'react'
import { getGameNow } from '#config'
import type { CodeReplacedPayload } from '#events/types'
import { GAME_EVENTS } from '#events/types'
import { useAnnounceProgress } from '#hooks/saves/useAnnounceProgress.hook'
import { noActiveLevelError, nothingToRestoreError } from '#services/utils/error-handling.service'
import { useProgressStore } from '#store/progress.store'
import {
  findLevelProgress,
  setLabSnapshot as putLabSnapshot,
  restorePlayerCode as restorePlayerCodeProgress,
  setLevelCode,
} from '#utils/progress/index'

const SOURCE = 'game/level'

export interface UseLevelCodeResult {
  /** Saved with the next save. */
  readonly setCode: (files: Readonly<Record<string, string>>) => ServiceResponse<void>
  /** Brings back the code kept by "use the reference". Fails if none was kept. */
  readonly restorePlayerCode: () => Promise<ServiceResponse<void>>
  readonly setLabSnapshot: (key: string | null) => ServiceResponse<void>
}

/** The active level's code and lab snapshot, as kept in the progress. */
export function useLevelCode(): UseLevelCodeResult {
  const { announceProgress } = useAnnounceProgress()

  return useMemo(() => {
    const store = useProgressStore.getState

    const setCode = (files: Readonly<Record<string, string>>): ServiceResponse<void> => {
      const active = store().active
      if (!active) return noActiveLevelError()
      store().setProgress(setLevelCode(store().progress, active.level.id, files))
      return { success: true }
    }

    const setLabSnapshot = (key: string | null): ServiceResponse<void> => {
      const active = store().active
      if (!active) return noActiveLevelError()
      store().setProgress(putLabSnapshot(store().progress, active.level.id, key))
      return { success: true }
    }

    const restorePlayerCode = async (): Promise<ServiceResponse<void>> => {
      const active = store().active
      if (!active) return noActiveLevelError()
      const kept = findLevelProgress(store().progress, active.level.id)?.playerCode
      if (!kept) return nothingToRestoreError()
      store().setProgress(restorePlayerCodeProgress(store().progress, active.level.id))
      eventBus.emit<CodeReplacedPayload>(
        GAME_EVENTS.CODE_REPLACED,
        { levelId: active.level.id, files: kept, owner: 'player', at: getGameNow() },
        { source: SOURCE }
      )
      await announceProgress(SOURCE)
      return { success: true }
    }

    return { setCode, restorePlayerCode, setLabSnapshot }
  }, [announceProgress])
}
