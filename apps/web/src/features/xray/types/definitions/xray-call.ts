import type { XrayCallFamily } from '@kernelfall/levels/types'
import type { StageSource } from './storyboard'

/** Which storyboard a call gets: write is drawn step by step, others share a shorter one. */
export type CallFamily = XrayCallFamily

/** One argument as it sits in a register at the `syscall` instruction. */
export interface CallArgument {
  /** `ebx`, `ecx`, … (i386) */
  readonly register: string
  /** Its slot in struct pt_regs: `di`, `si`, … */
  readonly ptReg: string
  /** Its name in the kernel's SYSCALL_DEFINE, e.g. `count`. */
  readonly name: string
  /** As the drawing prints it: decimal, or hex for addresses. */
  readonly value: string
}

/** How the call ended, already worked out for the narration. */
export type CallOutcome =
  | {
      readonly kind: 'returned'
      /** The raw value in eax: a count, a PID, or -errno. */
      readonly ret: number
      /** The errno name for a negative return, e.g. `EBADF`. */
      readonly errno: string | null
      /** What the C library hands the program: `ret`, or -1 on an error. */
      readonly toProgram: number
    }
  | { readonly kind: 'exited' }
  | { readonly kind: 'pending' }

export interface CallBuffer {
  /** Its address in the program's memory, e.g. `0x10000`. */
  readonly address: string
  /** One label per byte: printable characters, `␠`, `\n`, or an octal escape. */
  readonly cells: readonly string[]
  /** More bytes were passed than are drawn. */
  readonly more: boolean
  readonly count: number
}

export interface XrayCall {
  readonly id: number
  readonly pid: number
  /** The program the process was running, e.g. `echo` or `ls`. */
  readonly program: string
  readonly name: string
  readonly nr: number
  readonly family: CallFamily
  /** The call as a C programmer would read it, e.g. `write(1, "hello\n", 6)`. */
  readonly text: string
  readonly args: readonly CallArgument[]
  readonly buffer: CallBuffer | null
  /** The path a call like execve or openat took, read at entry. */
  readonly path: string | null
  readonly outcome: CallOutcome
  /** What reached the console while this call ran, if anything. */
  readonly console: string | null
  /** The kernel functions after `ia32_sys_call`, outermost first. */
  readonly kernelPath: readonly string[]
  /** One plain sentence for the "In the kernel now" desk. */
  readonly desk: string
  /** The kernel files its handler is checked against. */
  readonly sources: readonly StageSource[]
  /** What a successful return value is, for the narration, if the content says. */
  readonly returns: string | null
}
