import type { StepState } from '@shared/types'

/** `currentIndex` past the last step (a finished level) marks every step done. */
export function stepStates(count: number, currentIndex: number): readonly StepState[] {
  return Array.from({ length: count }, (_, index) => {
    if (index < currentIndex) {
      return 'done'
    }
    return index === currentIndex ? 'current' : 'future'
  })
}
