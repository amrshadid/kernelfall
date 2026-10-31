import type { LabEvent } from '#events/types'
import { useTraceStore } from '#store/trace.store'

// The app's name for it, so the app never imports from `/events`.
export type RunEvent = LabEvent

const NO_EVENTS: readonly RunEvent[] = []

/** Empty for no id, or a run that has scrolled out of the trace. */
export function useRunEvents(runId: number | null): readonly RunEvent[] {
  return useTraceStore((state) => (runId === null ? NO_EVENTS : (state.eventsByRun[runId] ?? NO_EVENTS)))
}
