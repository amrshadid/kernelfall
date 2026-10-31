import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { LabEvent } from '#events/types'
import type { FinishedCommand, TraceRunsState } from '#types/definitions/trace'
import { buildRun } from '#utils/trace/syscall-trace.util'
import { appendTraceRun, liveRunOf, replaceLiveRun } from '#utils/trace/trace-runs.util'

interface TraceActions {
  /** Replaces the command's live run, if it had one. */
  record: (events: readonly LabEvent[], command: FinishedCommand) => void
  /** All events so far of a command still running. */
  follow: (events: readonly LabEvent[], commandLine: string) => void
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
      follow: (events, commandLine) =>
        set((state) => {
          if (events.length === 0) {
            return state
          }
          const command = { commandLine, status: 0 }
          const live = liveRunOf(state, events)
          if (live) {
            return replaceLiveRun(state, { ...buildRun(live.id, events, command), running: true }, events)
          }
          return appendTraceRun(state, events, command, true)
        }),
      reset: () => set(initialState),
    }),
    { name: 'TraceStore' }
  )
)
