import type { VmPhase } from '@kernelfall/machine/types'

/** Why the Machine can't take a command yet: the terminal and Run wait for `ready`. */
export interface MachineLock {
  readonly phase: Exclude<VmPhase, 'ready'>
  /** e.g. "Booting Linux". */
  readonly title: string
  /** The status's own words, or a line about the phase. */
  readonly detail: string | null
  readonly failed: boolean
  /** Keys still reach the console: after a reboot, GRUB's menu and the boot are the player's to drive. */
  readonly typing: boolean
  /** Keys typed now wait in the Machine for the shell a level setup starts, and reach it in order. */
  readonly holdsKeys: boolean
  /** Why Run is off, for its title and screen readers. */
  readonly runReason: string
}
