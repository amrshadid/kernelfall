import { eventBus } from '@kernelfall/core/services'
import { useCallback, useMemo } from 'react'
import type { RevealPayload } from '#events/types'
import { MACHINE_EVENTS } from '#events/types'
import type { SourceLocation } from '#types/definitions/source'

// So a listener (or the bus's logging) can tell the flows apart.
const SOURCE = 'machine/reveal'

export interface UseRevealResult {
  /** Asks the editor to show a source location. */
  readonly reveal: (location: SourceLocation) => void
}

/** Sends source locations to the editor, which follows them with `useRevealRequests()`. */
export function useReveal(): UseRevealResult {
  const reveal = useCallback((location: SourceLocation): void => {
    eventBus.emit<RevealPayload>(MACHINE_EVENTS.REVEAL, location, { source: SOURCE })
  }, [])

  return useMemo(() => ({ reveal }), [reveal])
}
