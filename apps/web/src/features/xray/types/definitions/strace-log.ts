export type CallTone = 'ok' | 'error' | 'exit' | 'pending'

/** Standard output (fd 1) or standard error (fd 2). */
export type OutputStream = 'stdout' | 'stderr'

/** Split so the return value can be colored. */
export type LogLine =
  | {
      readonly kind: 'call'
      /** The syscall's id: selecting the line selects the call. */
      readonly id: number
      /** Everything before the return value, including strace's alignment padding. */
      readonly head: string
      readonly returned: string
      readonly tone: CallTone
      /** A write to fd 1 or fd 2, so results and error messages show as two streams. */
      readonly stream: OutputStream | null
    }
  | { readonly kind: 'exit'; readonly text: string }

export interface LogRun {
  readonly id: number
  readonly commandLine: string
  readonly lines: readonly LogLine[]
  /** Shown instead of lines when the command made no syscalls. */
  readonly note: string | null
}
