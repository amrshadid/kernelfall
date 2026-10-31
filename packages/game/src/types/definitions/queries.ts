import type { LabEventOf, Pid } from '@kernelfall/machine/events'

/** One syscall: its entry, and its return if it returned within the events given. */
export interface SyscallRecord {
  readonly enter: LabEventOf<'sys_enter'>
  readonly exit: LabEventOf<'sys_exit'> | undefined
}

/** A syscall that returned an error. */
export interface FailedCall {
  readonly call: SyscallRecord
  /** Positive, like errno: the kernel returned `-errno`. */
  readonly errno: number
}

/** A file a process asked to open, and what the kernel answered. */
export interface OpenedFile {
  /** The path as passed, e.g. `/etc/passwd` or `notes.txt`. */
  readonly path: string
  /** The open flags (`O_RDONLY`, `O_CREAT`…) as passed. */
  readonly flags: number
  /** The new fd, or a negative errno; undefined if the call never returned. */
  readonly ret: number | undefined
  /** The `seq` of the call's `sys_enter`. */
  readonly seq: number
}

/** One file or folder a process opened, and how far it read it before closing. */
export interface FileRead {
  /** The path as passed to openat(). */
  readonly path: string
  readonly fd: number
  /** A read() or getdents64() on it returned 0: end of file, or no more entries. */
  readonly reachedEnd: boolean
  /** What its read() calls returned, joined, as the trace recorded each (its first bytes). */
  readonly text: string
}

/** How a process ended, from its `sched_process_exit`. */
export interface ProcessExit {
  readonly seq: number
  readonly code: number
  /** Set when a signal killed it instead. */
  readonly signal: number | undefined
}

/** A child a process forked, and whether the parent's wait4() collected it. */
export interface ForkedChild {
  readonly pid: Pid
  /** The `seq` of its `sched_process_fork`. */
  readonly forkSeq: number
  /** The `seq` of the parent's wait4() return that reaped it, or null if never reaped. */
  readonly reapedSeq: number | null
}

/** A forked child and what it did: the command a shell ran in it, as the events show it. */
export interface ChildRun extends ForkedChild {
  /** The programs it became, by execve() filename; empty if every execve() failed. */
  readonly programs: readonly string[]
  /** The errno of each execve() that failed. */
  readonly execErrors: readonly number[]
  readonly stdout: string
  readonly stderr: string
  readonly exit: ProcessExit | undefined
}
