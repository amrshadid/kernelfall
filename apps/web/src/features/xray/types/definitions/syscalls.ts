import type { Stage } from './storyboard'
import type { XrayCall } from './xray-call'

/** Where one syscall is on its trip through the Gate. */
export type CallStep =
  | 'call'
  | 'registers'
  | 'gate'
  | 'entry'
  | 'dispatch'
  | 'fd'
  | 'copy'
  | 'driver'
  | 'work'
  | 'noreturn'
  | 'answer'
  | 'sysret'

export interface SyscallScene {
  readonly step: CallStep
  /** 3 in user mode, 0 in kernel mode. */
  readonly ring: 0 | 3
  /** Kernel functions running now, from the storyboard's call path. */
  readonly active: readonly string[]
  /** How many rows of the call path the call has reached so far. */
  readonly reached: number
  /** The registers hold the request. */
  readonly loaded: boolean
  /** entry_INT80_32 has saved them in pt_regs. */
  readonly saved: boolean
  /** The return value is in pt_regs->ax. */
  readonly answered: boolean
  /** The user bytes have been copied into kernel memory. */
  readonly copied: boolean
  /** The output has reached the screen. */
  readonly printed: boolean
  /** Back in the program, which has the return value. */
  readonly back: boolean
  /** "In the kernel now" at Simple: the function, a plain sentence, its file. */
  readonly desk: { readonly fn: string; readonly say: string; readonly file: string }
}

export interface SyscallStoryboard {
  /** Keys the player's guesses and resets playback when the call changes. */
  readonly key: string
  readonly call: XrayCall
  /** Every kernel function the call passes, outermost first, for the Deep call path. */
  readonly path: readonly string[]
  readonly stages: readonly Stage<SyscallScene>[]
}
