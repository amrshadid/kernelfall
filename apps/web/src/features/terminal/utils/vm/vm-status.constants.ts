import type { VmPhase } from '@kernelfall/machine/types'

/** What the terminal says while Linux starts; a ready shell speaks for itself. */
export const VM_STATUS_LINES: Partial<Record<VmPhase, string>> = {
  loading: 'Loading the Machine (Linux 6.18). The first visit downloads about 11 MB…',
  booting: 'Booting Linux…',
  failed: 'The Machine could not start:',
}

/** Dim text, then back to normal. */
export const DIM = '\x1b[2m'
export const RESET = '\x1b[0m'
