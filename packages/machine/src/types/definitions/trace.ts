import type { LabEvent } from '#events/types'
import type { Pid } from '#types/definitions/task'

/** How many command runs the trace remembers. Older ones scroll away. */
export const MAX_TRACE_RUNS = 50

/** The command line a batch of events came from, and its exit status. */
export interface FinishedCommand {
  readonly commandLine: string
  readonly status: number
}

/** How a syscall ended: it returned, it ended the process, or it hasn't finished yet. */
export type CallResult =
  | { readonly kind: 'returned'; readonly ret: number }
  | { readonly kind: 'exited' }
  | { readonly kind: 'pending' }

/** One syscall, assembled from its `sys_enter` and `sys_exit` events. */
export interface TraceCall {
  /** The `seq` of its `sys_enter` event: unique for the whole session. */
  readonly id: number
  readonly pid: Pid
  readonly nr: number
  readonly name: string
  readonly args: readonly number[]
  readonly data?: Uint8Array
  readonly result: CallResult
}

/** Everything one command line did. */
export interface TraceRun {
  readonly id: number
  readonly commandLine: string
  readonly status: number
  readonly pid: Pid | null
  readonly calls: readonly TraceCall[]
  /** The status from `sched_process_exit`, or null if the process didn't exit (or never ran). */
  readonly exitCode: number | null
  /** True while the command still runs: its calls and events so far, and `status` 0 until it ends. */
  readonly running?: boolean
}

/** The runs a trace remembers, and the events behind each one. */
export interface TraceRunsState {
  /** Most recent last, capped at MAX_TRACE_RUNS. */
  readonly runs: readonly TraceRun[]
  /** By run id. X-ray's process view needs the scheduler events a run's syscall list leaves out. */
  readonly eventsByRun: Readonly<Record<number, readonly LabEvent[]>>
}
