import type { Stamped } from '@kernelfall/core/types'
import type { BootSummary } from '#types/definitions/boot'
import type { CallRoute } from '#types/definitions/route'
import type { SignalGenerateResult } from '#types/definitions/signal'
import type { SourceLocation } from '#types/definitions/source'
import type { Pid } from '#types/definitions/task'

export const MACHINE_EVENTS = {
  /** Show a source location in the editor (a clicked `file:line` in the terminal). */
  REVEAL: 'MACHINE_REVEAL',
} as const

export type RevealPayload = SourceLocation

export const LAB_EVENTS = {
  COMMAND_FINISHED: 'LAB_COMMAND_FINISHED',
  /** Throttled (TRACE_PROGRESS_MS) and at once when the command waits for input; always before its COMMAND_FINISHED. */
  COMMAND_PROGRESS: 'LAB_COMMAND_PROGRESS',
  /** Once per started Machine, when Linux first reaches the player's shell: its boot, from dmesg. */
  BOOTED: 'LAB_BOOTED',
} as const

export interface BootedPayload {
  readonly boot: BootSummary
}

export interface CommandFinishedPayload {
  readonly command: { readonly commandLine: string; readonly status: number }
  readonly events: readonly LabEvent[]
}

export interface CommandProgressPayload {
  readonly command: { readonly commandLine: string }
  /** Everything since the command started, not only what is new. */
  readonly events: readonly LabEvent[]
}

// Re-exported because event consumers (game, levels) name pids with it.
export type { Pid }

/** Types use the real kernel tracepoint name when one exists. */
export type LabEventInit = LabEventKind & {
  /** The CPU the event happened on, as every tracepoint record carries; absent for the console. */
  readonly cpu?: number
}

type LabEventKind =
  | {
      readonly type: 'sys_enter'
      readonly pid: Pid
      readonly nr: number
      readonly name: string
      readonly args: readonly number[]
      /**
       * What a write took from its buffer (read as the call returned, so its page is in), or the path
       * it names without the NUL.
       */
      readonly data?: Uint8Array
      /** The call moved more bytes than `data` holds: the capture's limit, not a short write. */
      readonly dataCut?: boolean
      /** execve's argv, as strace prints it; absent if unreadable. */
      readonly argv?: readonly string[]
    }
  | {
      readonly type: 'sys_exit'
      readonly pid: Pid
      readonly nr: number
      readonly name: string
      /** A negative value is -errno. */
      readonly ret: number
      /** The start of a user buffer the call filled, after a successful return. */
      readonly data?: Uint8Array
      /** The call filled more bytes than `data` holds. */
      readonly dataCut?: boolean
      /** The filesystem or driver the VFS handed the call to, for calls on files. */
      readonly route?: CallRoute
    }
  | {
      readonly type: 'sched_process_fork'
      readonly parentPid: Pid
      readonly childPid: Pid
    }
  | {
      readonly type: 'sched_process_exec'
      readonly pid: Pid
      /** Always `pid`: without threads, no other thread's pid is taken over. */
      readonly oldPid: Pid
      /** As passed to execve(), e.g. "./a.out". */
      readonly filename: string
    }
  | {
      readonly type: 'sched_process_exit'
      readonly pid: Pid
      /** The low 8 bits of the code passed to exit(); 0 when `signal` is set. */
      readonly code: number
      /** Set when a signal killed the task instead. */
      readonly signal?: number
    }
  | {
      /** A zombie was reaped. */
      readonly type: 'sched_process_free'
      readonly pid: Pid
    }
  | {
      readonly type: 'signal_generate'
      readonly pid: Pid
      readonly sig: number
      readonly result: SignalGenerateResult
    }
  | {
      /** Task `pid` is handling a signal: running its handler or its default action. */
      readonly type: 'signal_deliver'
      readonly pid: Pid
      readonly sig: number
    }
  | {
      /** A program touched memory it has no right to (exceptions:page_fault_user); SIGSEGV follows. */
      readonly type: 'page_fault_user'
      readonly pid: Pid
      readonly address: number
      readonly ip: number
      readonly errorCode: number
    }
  | {
      /**
       * Bytes that reached the terminal (n_tty_write), as the program wrote them: before the tty
       * turns \n into \r\n. In order with the syscalls; `pid` is the writer.
       */
      readonly type: 'console_write'
      readonly pid?: Pid
      readonly bytes: Uint8Array
    }

/** X-ray, checkers, Taint and golden tests all read this one stream, so they never disagree. */
export type LabEvent = Stamped<LabEventInit>

export type LabEventType = LabEvent['type']
export type LabEventOf<T extends LabEventType> = Extract<LabEvent, { type: T }>
