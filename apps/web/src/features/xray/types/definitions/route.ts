/** Who served a call below the syscall's own handler. */
export type RoutePartKind = 'fs' | 'driver' | 'kernel'

/** A filesystem or driver as the route view names it. */
export interface RoutePart {
  readonly kind: RoutePartKind
  /** `ext4`, `procfs`, `tty driver`, or for a call no file served, the kernel's part. */
  readonly name: string
  /** Where it lives in the Linux 6.18 tree. */
  readonly source: string
}

/** What a filesystem or driver hands a call on to, below the function the trace names. */
export interface RouteBelow {
  /** Kernel functions after the one the trace names, outermost first. */
  readonly fns: readonly string[]
  /** Where the data comes from or goes to in the end, in plain words. */
  readonly end: string | null
}

/** One call of the run, with the process that made it and the kernel part that served it. */
export interface RouteRow {
  readonly id: number
  readonly pid: number
  readonly program: string
  /** The call as a C programmer reads it, e.g. `read(3, …, 256)`. */
  readonly text: string
  /** `= 3`, `= -1 EACCES`, or `= ?` for a call that never returned. */
  readonly result: string
  /** The syscall, then each kernel function down to the part that served it: read → vfs_read() → … */
  readonly steps: readonly string[]
  readonly part: RoutePart
  /** Where it ends, past the functions: the disk, the console. */
  readonly end: string | null
  /** The file the call worked on, when the run opened it. */
  readonly file: string | null
}

export interface RouteView {
  readonly commandLine: string
  readonly rows: readonly RouteRow[]
}
