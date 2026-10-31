import type { PlacementStep } from '@features/placement/types'
import type {
  CheckInput,
  GameContent,
  PlacementCheck,
  PlacementProgress,
  PlacementResult,
} from '@kernelfall/game/types'
import { judgePlacement, mergePlacement, placementResult } from '@kernelfall/game/utils'
import { useCallback, useRef, useState } from 'react'

export interface UsePlacementCheckInput {
  readonly content: GameContent
  readonly check: PlacementCheck
  /** Applies the result to the progress (usePlacementActions' place). */
  readonly place: (result: PlacementResult) => Promise<unknown>
}

export interface UsePlacementCheckResult {
  readonly step: PlacementStep
  /** The task on screen, by its index in the check. */
  readonly index: number
  readonly progress: PlacementProgress
  readonly result: PlacementResult | null
  readonly begin: () => void
  readonly goTo: (index: number) => void
  /** Judges one finished command against every task, as the tasks' own levels would. */
  readonly judge: (events: CheckInput['events']) => void
  readonly finish: () => Promise<void>
  /** Starts over: the check can be retaken any time. */
  readonly retake: () => void
}

const NOTHING_MET: PlacementProgress = new Map()

/** The check's screens: the offer, its tasks one at a time, then where it leaves the player. */
export function usePlacementCheck({ content, check, place }: UsePlacementCheckInput): UsePlacementCheckResult {
  const [step, setStep] = useState<PlacementStep>('offer')
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState<PlacementProgress>(NOTHING_MET)
  const [result, setResult] = useState<PlacementResult | null>(null)
  // Read when finishing, so a command that ended a moment before still counts.
  const latest = useRef(progress)
  latest.current = progress

  const judge = useCallback(
    (events: CheckInput['events']) => {
      if (step !== 'tasks') return
      const found = judgePlacement(content, check, { events })
      setProgress((before) => mergePlacement(before, found))
    },
    [check, content, step]
  )

  const finish = useCallback(async () => {
    const outcome = placementResult(check, latest.current)
    await place(outcome)
    setResult(outcome)
    setStep('result')
  }, [check, place])

  const retake = useCallback(() => {
    setProgress(NOTHING_MET)
    setResult(null)
    setIndex(0)
    setStep('tasks')
  }, [])

  return {
    step,
    index,
    progress,
    result,
    begin: () => setStep('tasks'),
    goTo: (next) => setIndex(Math.max(0, Math.min(check.tasks.length - 1, next))),
    judge,
    finish,
    retake,
  }
}
