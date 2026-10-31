import type { LabEvent } from '#events/types'

/** One line of the guest's trace_pipe, as the host reads it from COM2. */
export type TraceRecord = TraceHeader &
  (
    | { readonly kind: 'enter'; readonly name: string; readonly args: readonly number[] }
    | { readonly kind: 'exit'; readonly name: string; readonly ret: number }
    /** A probe of the `kf` group (eprobe or return probe): user memory a syscall tracepoint doesn't print. */
    | { readonly kind: 'probe'; readonly probe: string; readonly fields: Readonly<Record<string, string>> }
    | { readonly kind: 'marker'; readonly text: string }
    | { readonly kind: 'event'; readonly name: string; readonly fields: Readonly<Record<string, string>> }
  )

export interface TraceHeader {
  readonly comm: string
  readonly pid: number
  readonly cpu: number
  /** Nanoseconds since boot. */
  readonly time: number
}

// The guest's probes and the host's parser share this layout. User buffers are read as 32-bit words
// (the kernel refuses `+u…:u8[N]` array fetches), in chunks of one probe each: chunk k > 0 has a
// filter, so it only fires when the call moved more than k chunks, and small calls stay one line.
/** The probes' group in tracefs; the host knows their lines by it. */
export const VM_TRACE_GROUP = 'kf'
export const VM_TRACE_CHUNK_WORDS = 64
export const VM_TRACE_CHUNK_BYTES = VM_TRACE_CHUNK_WORDS * 4
/** write(): 1 KiB, musl's stdio buffer. */
export const VM_TRACE_WRITE_CHUNKS = 4
export const VM_TRACE_READ_CHUNKS = 4
/** writev(): the iovecs read, and the chunks of each (musl's stdio writes two: its buffer, then the rest). */
export const VM_TRACE_IOVECS = 4
export const VM_TRACE_IOV_CHUNKS = 2
/** What reaches the terminal: n_tty takes writes 2 KiB at a time. */
export const VM_TRACE_TTY_CHUNKS = 8
/** execve() argv strings read. */
export const VM_TRACE_ARGV = 8

/** The probes' event names, by what they read: `write_<chunk>`, `writev_<iovec>_<chunk>`… */
export const TRACE_PROBES = {
  write: 'write',
  writev: 'writev',
  read: 'read',
  tty: 'tty',
  execve: 'execve',
  path: 'path',
} as const

/**
 * Syscalls whose path arguments the guest reads when they return (the page is in by then), by the
 * argument's index; renameat2's names are its 2nd and 4th arguments.
 */
export const VM_TRACE_PATH_ARGS: Readonly<Record<string, readonly number[]>> = {
  open: [0],
  openat: [1],
  creat: [0],
  stat64: [0],
  lstat64: [0],
  statx: [1],
  access: [0],
  faccessat: [1],
  faccessat2: [1],
  chdir: [0],
  mkdir: [0],
  mkdirat: [1],
  rmdir: [0],
  unlink: [0],
  unlinkat: [1],
  rename: [0, 1],
  renameat2: [1, 3],
  chmod: [0],
  fchmodat: [1],
  readlink: [0],
  readlinkat: [1],
  symlink: [0, 1],
  link: [0, 1],
}

/** A probe field the kernel couldn't read, e.g. argv past its NULL. */
export const TRACE_FAULT = '(fault)'

/** A command line the player ran, and everything the kernel did for it so far. */
export interface TracedCommand {
  readonly commandLine: string
  /** Its exit status, once it has finished; null while it runs. */
  readonly status: number | null
  readonly events: readonly LabEvent[]
}

/** Progress reaches the page at most this often: a gcc run is thousands of events. */
export const TRACE_PROGRESS_MS = 100
