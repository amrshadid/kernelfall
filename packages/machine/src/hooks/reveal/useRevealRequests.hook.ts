import { useEventListener } from '@kernelfall/core/hooks'
import type { RevealPayload } from '#events/types'
import { MACHINE_EVENTS } from '#events/types'

/** Source locations someone asked the editor to show. */
export function useRevealRequests(handler: (location: RevealPayload) => void): void {
  useEventListener<RevealPayload>(MACHINE_EVENTS.REVEAL, (event) => handler(event.payload))
}
