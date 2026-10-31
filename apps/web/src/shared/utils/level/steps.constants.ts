import type { StepId } from '@shared/types'

/** The five visible steps of the level loop, in order. `oops` shows as Build it. */
export const STEPS: readonly { readonly id: StepId; readonly label: string }[] = [
  { id: 'scene', label: 'Scene' },
  { id: 'see', label: 'See it' },
  { id: 'build', label: 'Build it' },
  { id: 'watch', label: 'Watch it' },
  { id: 'card', label: 'Card' },
]

export const DONE_LABEL = 'Done'
