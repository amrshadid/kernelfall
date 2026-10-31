import { useMemo } from 'react'
import { useTraceStore } from '#store/trace.store'
import type { SyscallInfo } from '#types/definitions/syscall-info'
import type { TraceCall, TraceRun } from '#types/definitions/trace'
import { formatStraceLine } from '#utils/strace/strace-format.util'
import { describeOutcome, syscallInfo } from '#utils/trace/syscall-info.util'
import { findCall } from '#utils/trace/syscall-trace.util'

export interface UseTraceCallResult {
  readonly run: TraceRun
  readonly call: TraceCall
  /** The call exactly as strace prints it. */
  readonly straceLine: string
  /** What the call is: summary, man page, the kernel code it models. */
  readonly info: SyscallInfo
  /** One sentence on how this call ended. */
  readonly outcome: string
}

/** One call from the trace by its id, with what X-ray says about it; undefined if it's gone. */
export function useTraceCall(id: number | null): UseTraceCallResult | undefined {
  const runs = useTraceStore((state) => state.runs)
  return useMemo(() => {
    const found = findCall(runs, id)
    if (found === undefined) {
      return undefined
    }
    const { run, call } = found
    return {
      run,
      call,
      straceLine: formatStraceLine(call),
      info: syscallInfo(call.name),
      outcome: describeOutcome(call.result, run.exitCode),
    }
  }, [runs, id])
}
