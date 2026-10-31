import type { VmPhase } from '@kernelfall/machine/types'

/** Whose shell the terminal is: init's in the Prologue, the player's after. */
export const TERMINAL_LABELS = {
  prologue: "init's shell · Linux 6.18",
  default: 'your shell · Linux 6.18',
} as const

export const MACHINE_STATUS: Readonly<Record<VmPhase, string>> = {
  off: 'Linux: off',
  loading: 'Linux: loading',
  booting: 'Linux: booting',
  restoring: 'Linux: restoring',
  ready: 'Linux: running',
  failed: 'Linux: failed',
}
