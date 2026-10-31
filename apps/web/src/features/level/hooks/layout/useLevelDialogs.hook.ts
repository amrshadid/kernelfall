import type { LevelDialogs } from '@features/level/types'
import type { LevelPhase } from '@kernelfall/game/types'
import type { StepId } from '@shared/types'
import { useEffect, useState } from 'react'

/** The level screen's view state: a done step looked back at, and the Taint, reference and replay dialogs. */
export function useLevelDialogs(phase: LevelPhase): LevelDialogs {
  const [reviewing, setReviewing] = useState<StepId | null>(null)
  const [taintOpen, setTaintOpen] = useState(false)
  const [referenceOpen, setReferenceOpen] = useState(false)
  const [replayOpen, setReplayOpen] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new step ends any look back
  useEffect(() => {
    setReviewing(null)
  }, [phase])

  return {
    reviewing,
    review: setReviewing,
    toggleReview: (stepId) => setReviewing((was) => (was === stepId ? null : stepId)),
    taintOpen,
    setTaintOpen,
    referenceOpen,
    setReferenceOpen,
    replayOpen,
    setReplayOpen,
  }
}
