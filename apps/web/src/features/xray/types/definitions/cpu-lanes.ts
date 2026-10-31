/** As `ps` prints STAT: running or runnable, sleeping in a call, stopped by a signal, a zombie. */
export type LaneTaskState = 'R' | 'S' | 'T' | 'Z'

/** One stretch of a lane where one task ran without another task's events between. */
export interface CpuSlice {
  readonly pid: number
  /** Null for a task the run didn't see start or exec, like init's background programs. */
  readonly program: string | null
  /** The syscalls it made in this stretch, in order. */
  readonly calls: readonly string[]
}

/** A task placed on a CPU, with its state when the run ends. */
export interface CpuQueueTask {
  readonly pid: number
  readonly program: string | null
  readonly state: LaneTaskState
}

export interface CpuLane {
  readonly cpu: number
  readonly slices: readonly CpuSlice[]
  /** The CPU's run queue at the end of the run: every task placed on it that hasn't been freed. */
  readonly queue: readonly CpuQueueTask[]
}

export interface CpuLanesView {
  readonly commandLine: string
  readonly lanes: readonly CpuLane[]
}
