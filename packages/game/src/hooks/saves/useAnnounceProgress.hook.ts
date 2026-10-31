import { eventBus } from '@kernelfall/core/services'
import { useMemo } from 'react'
import { getGameNow } from '#config'
import type { ProgressChangedPayload } from '#events/types'
import { GAME_EVENTS } from '#events/types'
import { settleSaves } from '#services/utils/save-queue.service'

export interface UseAnnounceProgressResult {
  /** Announces a change worth keeping; autosave writes it, and this resolves once it has landed. */
  readonly announceProgress: (source: string) => Promise<void>
}

export function useAnnounceProgress(): UseAnnounceProgressResult {
  return useMemo(
    () => ({
      announceProgress: (source: string) => {
        eventBus.emit<ProgressChangedPayload>(GAME_EVENTS.PROGRESS_CHANGED, { at: getGameNow() }, { source })
        return settleSaves()
      },
    }),
    []
  )
}
