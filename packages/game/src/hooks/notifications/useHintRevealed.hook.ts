import { useEventListener } from '@kernelfall/core/hooks'
import type { HintRevealedPayload } from '#events/types'
import { GAME_EVENTS } from '#events/types'

/** Each hint the player reveals, by tier. */
export function useHintRevealed(handler: (hint: HintRevealedPayload) => void): void {
  useEventListener<HintRevealedPayload>(GAME_EVENTS.HINT_REVEALED, (event) => handler(event.payload))
}
