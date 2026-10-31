import { useTraceStore } from '#store/trace.store'
import type { TraceRun } from '#types/definitions/trace'

export interface UseSyscallTraceResult {
  /** Most recent last. */
  readonly runs: readonly TraceRun[]
  readonly latest: TraceRun | undefined
  readonly isEmpty: boolean
  readonly clear: () => void
}

/** As `strace -f` would see them. */
export function useSyscallTrace(): UseSyscallTraceResult {
  const runs = useTraceStore((state) => state.runs)
  const clear = useTraceStore((state) => state.reset)
  return { runs, latest: runs.at(-1), isEmpty: runs.length === 0, clear }
}
