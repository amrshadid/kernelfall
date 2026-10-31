import type { LabEvent } from '#events/types'
import type { FinishedCommand, TraceRun, TraceRunsState } from '#types/definitions/trace'
import { appendRun } from '#utils/trace/syscall-trace.util'

/** The events of the runs still remembered, with `events` as the new run's. */
export function keepRunEvents(
  previous: TraceRunsState['eventsByRun'],
  runs: readonly TraceRun[],
  added: TraceRun,
  events: readonly LabEvent[]
): TraceRunsState['eventsByRun'] {
  const next: Record<number, readonly LabEvent[]> = {}
  for (const run of runs) {
    const kept = run.id === added.id ? events : previous[run.id]
    if (kept) {
      next[run.id] = kept
    }
  }
  return next
}

// Each update carries everything since the command started, so it begins with
// the live run's first event; a run left from a command that never finished doesn't match.
export function liveRunOf(state: TraceRunsState, events: readonly LabEvent[]): TraceRun | undefined {
  const last = state.runs.at(-1)
  if (!last?.running) {
    return undefined
  }
  const first = state.eventsByRun[last.id]?.[0]
  return first !== undefined && first.seq === events[0]?.seq ? last : undefined
}

export function replaceLiveRun(state: TraceRunsState, run: TraceRun, events: readonly LabEvent[]): TraceRunsState {
  return { runs: [...state.runs.slice(0, -1), run], eventsByRun: { ...state.eventsByRun, [run.id]: events } }
}

/** Adds the command as a new run, live if `running`; returns `state` itself when nothing changes. */
export function appendTraceRun(
  state: TraceRunsState,
  events: readonly LabEvent[],
  command: FinishedCommand,
  running: boolean
): TraceRunsState {
  // A live run whose command never finished (the worker stopped) is over now.
  const history = state.runs.map((run) => (run.running ? { ...run, running: false } : run))
  const runs = appendRun(history, events, command)
  const added = runs.at(-1)
  // A blank line is not a run.
  if (runs === history || !added) {
    return state
  }
  const run = running ? { ...added, running: true } : added
  const next = running ? [...runs.slice(0, -1), run] : runs
  return { runs: next, eventsByRun: keepRunEvents(state.eventsByRun, next, run, events) }
}
