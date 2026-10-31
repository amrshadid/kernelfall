import type { LabEvent } from '#events/types'
import type { TracedCommand } from '#types/definitions/vm-trace'

/** `events` (which start at `from`) laid over `known`; undefined when `known` doesn't reach `from`. */
export function spliceEvents(
  known: readonly LabEvent[],
  from: number,
  events: readonly LabEvent[]
): readonly LabEvent[] | undefined {
  if (from > known.length) {
    return undefined
  }
  return from === 0 ? events : known.slice(0, from).concat(events)
}

/** One progress update for both, while the first still waits to be sent: each runs to the run's end. */
export function mergeProgress(pending: TracedCommand | null, next: TracedCommand): TracedCommand {
  const nextFrom = next.from ?? 0
  const pendingFrom = pending?.from ?? 0
  if (!pending || pending.commandLine !== next.commandLine || nextFrom <= pendingFrom) {
    return next
  }
  const events = spliceEvents(pending.events, nextFrom - pendingFrom, next.events)
  return events ? { ...next, from: pendingFrom, events } : next
}
