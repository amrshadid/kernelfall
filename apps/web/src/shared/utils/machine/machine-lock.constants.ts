import type { VmPhase } from '@kernelfall/machine/types'

export const MACHINE_LOCK_TEXT: Readonly<
  Record<Exclude<VmPhase, 'ready'>, { readonly title: string; readonly detail: string }>
> = {
  off: { title: 'Starting the Machine', detail: 'Waking the emulator.' },
  loading: {
    title: 'Loading the Machine',
    detail: 'Fetching the emulator and Linux 6.18. The first visit downloads about 11 MB.',
  },
  booting: { title: 'Booting Linux', detail: 'The kernel is starting; the shell opens when it is done.' },
  restoring: { title: 'Restoring the Machine', detail: "Setting up this level's clean Machine." },
  failed: { title: 'The Machine could not start', detail: 'Reload the page to try again.' },
}

export const RESTORING_HOLDS_KEYS = "Setting up this level's clean Machine. What you type now reaches its new shell."
export const RUN_WAITS = 'Run works once Linux is running.'
export const RUN_FAILED = 'Run needs a running Machine. Reload the page to try again.'
