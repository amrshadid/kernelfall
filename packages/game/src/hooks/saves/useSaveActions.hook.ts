import { eventBus } from '@kernelfall/core/services'
import type { ServiceResponse } from '@kernelfall/core/types'
import { useMemo } from 'react'
import { getGameConfig, getGameNow } from '#config'
import type { OpenedPayload, ProgressResetPayload } from '#events/types'
import { GAME_EVENTS } from '#events/types'
import { useAnnounceProgress } from '#hooks/saves/useAnnounceProgress.hook'
import { saveApi } from '#services/api/save.api'
import { invalidSaveError, saveFailedError } from '#services/utils/error-handling.service'
import { saveProgress } from '#services/utils/save-progress.service'
import { queueRemove } from '#services/utils/save-queue.service'
import { useProgressStore } from '#store/progress.store'
import type { Progress } from '#types/definitions/progress'
import type { LoadedSave } from '#types/definitions/saves'
import { SAVE_ISSUES } from '#types/definitions/saves'
import { emptyProgress } from '#utils/progress/index'
import { exportSave, importSave } from '#utils/saves/index'

const SOURCE = 'game/saves'

export interface UseSaveActionsResult {
  /** A save that can't be read is kept untouched: the game opens empty, in memory, and this fails. */
  open: () => Promise<ServiceResponse<Progress>>
  saveNow: () => Promise<ServiceResponse<void>>
  exportSave: () => string
  /** Closes the active level. */
  importSave: (json: string) => Promise<ServiceResponse<LoadedSave>>
  reset: () => Promise<ServiceResponse<void>>
}

export function useSaveActions(): UseSaveActionsResult {
  const { announceProgress } = useAnnounceProgress()

  return useMemo(() => {
    const store = useProgressStore.getState

    const open = async (): Promise<ServiceResponse<Progress>> => {
      store().opening()
      const epoch = store().epoch
      const loaded = await saveApi.load(getGameConfig().slot)
      // An import or reset finished while the save was loading: it wins, and the loaded save is dropped.
      if (store().epoch !== epoch) {
        return { success: true, data: store().progress }
      }
      if (!loaded.success || !loaded.data) {
        store().open(emptyProgress(), null, SAVE_ISSUES.unreadable)
        eventBus.emit<OpenedPayload>(
          GAME_EVENTS.OPENED,
          { saveIssue: SAVE_ISSUES.unreadable, at: getGameNow() },
          { source: SOURCE }
        )
        return loaded.error ? { success: false, error: loaded.error } : { success: false }
      }
      store().open(loaded.data.progress, loaded.data.savedAt, null)
      eventBus.emit<OpenedPayload>(GAME_EVENTS.OPENED, { saveIssue: null, at: getGameNow() }, { source: SOURCE })
      return { success: true, data: loaded.data.progress }
    }

    const saveNow = async (): Promise<ServiceResponse<void>> => {
      await saveProgress()
      const issue = store().saveIssue
      return issue === null ? { success: true } : saveFailedError(issue)
    }

    const importProgress = async (json: string): Promise<ServiceResponse<LoadedSave>> => {
      const loaded = importSave(json)
      if (!loaded.ok) return invalidSaveError(loaded.errors)
      // The player chose this save, so it may replace one the game couldn't read.
      store().open(loaded.value.progress, store().lastSavedAt, null)
      await announceProgress(SOURCE)
      return { success: true, data: loaded.value }
    }

    const reset = async (): Promise<ServiceResponse<void>> => {
      store().open(emptyProgress(), null, null)
      await queueRemove(getGameConfig().slot)
      eventBus.emit<ProgressResetPayload>(GAME_EVENTS.PROGRESS_RESET, { at: getGameNow() }, { source: SOURCE })
      return { success: true }
    }

    return {
      open,
      saveNow,
      exportSave: () => exportSave(store().progress, getGameNow()),
      importSave: importProgress,
      reset,
    }
  }, [announceProgress])
}
