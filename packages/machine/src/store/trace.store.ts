import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { LabEvent } from '#events/types'
import type { FinishedCommand, TraceRunsState } from '#types/definitions/trace'
import { buildRun } from '#utils/trace/syscall-trace.util'
import { appendTraceRun, liveRunOf, replaceLiveRun } from '#utils/trace/trace-runs.util'
import { spliceEvents } from '#utils/vm-trace/trace-progress.util'

interface TraceActions {
  /** Replaces the command's live run, if it had one. */
  record: (events: readonly LabEvent[], command: FinishedCommand) => void
  /** A command still running: its events from index `from` on; the ones before it are already in its live run. */
  follow: (from: number, events: readonly LabEvent[], commandLine: string) => void
  reset: () => void
}

type TraceStore = TraceRunsState & TraceActions

const initialState: TraceRunsState = {
  runs: [],
  eventsByRun: {},
}

export const useTraceStore = create<TraceStore>()(
  devtools(
    (set) => ({
      ...initialState,
      record: (events, command) =>
        set((state) => {
          const live = liveRunOf(state, events)
          if (live) {
            return replaceLiveRun(state, buildRun(live.id, events, command), events)
          }
          return appendTraceRun(state, events, command, false)
        }),
      follow: (from, delta, commandLine) =>
        set((state) => {
          const command = { commandLine, status: 0 }
          if (from > 0) {
            const live = state.runs.at(-1)
            const events = live?.running ? spliceEvents(state.eventsByRun[live.id] ?? [], from, delta) : undefined
            // An update for a run this page never saw start is dropped: its finish brings everything.
            if (!(live && events)) {
              return state
            }
            return replaceLiveRun(state, { ...buildRun(live.id, events, command), running: true }, events)
          }
          if (delta.length === 0) {
            return state
          }
          const live = liveRunOf(state, delta)
          if (live) {
            return replaceLiveRun(state, { ...buildRun(live.id, delta, command), running: true }, delta)
          }
          return appendTraceRun(state, delta, command, true)
        }),
      reset: () => set(initialState),
    }),
    { name: 'TraceStore' }
  )
)
