import type { LevelPhase } from '@kernelfall/game/types'
import { DONE_LABEL, STEPS } from './steps.constants'

/** Index of a phase on the step rail; `complete` is past the last step. */
export function stepIndexOf(phase: LevelPhase): number {
  if (phase === 'oops') {
    return STEPS.findIndex((step) => step.id === 'build')
  }
  if (phase === 'complete') {
    return STEPS.length
  }
  return STEPS.findIndex((step) => step.id === phase)
}

/** The step a phase shows as, for "Next: See it" lines outside the level. */
export function stepLabelOf(phase: LevelPhase): string {
  return STEPS[stepIndexOf(phase)]?.label ?? DONE_LABEL
}
