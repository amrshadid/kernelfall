import { useEventListener } from '@kernelfall/core/hooks'
import type { LevelCompletedPayload } from '#events/types'
import { GAME_EVENTS } from '#events/types'

/** Each level the player passes, by their code or with init's version, with its score and Taint. */
export function useLevelCompleted(handler: (completion: LevelCompletedPayload) => void): void {
  useEventListener<LevelCompletedPayload>(GAME_EVENTS.LEVEL_COMPLETED, (event) => handler(event.payload))
}
