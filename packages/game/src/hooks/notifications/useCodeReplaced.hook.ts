import { useEventListener } from '@kernelfall/core/hooks'
import type { CodeReplacedPayload } from '#events/types'
import { GAME_EVENTS } from '#events/types'

/** The level's code swapped from outside the editor: init's version loaded, or the player's restored. */
export function useCodeReplaced(handler: (replaced: CodeReplacedPayload) => void): void {
  useEventListener<CodeReplacedPayload>(GAME_EVENTS.CODE_REPLACED, (event) => handler(event.payload))
}
