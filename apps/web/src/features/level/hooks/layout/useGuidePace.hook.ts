import type { GuidePace } from '@features/level/types'
import { useCommandResults } from '@kernelfall/machine/hooks'
import { useState } from 'react'

interface PaceState {
  readonly key: string
  readonly shown: number
  readonly picks: GuidePace['picks']
}

/**
 * How far into a step's transcript the player is. Each command they finish shows the next beat, so
 * the explanation of a result comes after the result. `key` names the step; a new one starts over.
 */
export function useGuidePace(key: string): GuidePace {
  const [pace, setPace] = useState<PaceState>({ key, shown: 1, picks: {} })
  const current = pace.key === key ? pace : { key, shown: 1, picks: {} }
  const advance = () => setPace({ ...current, shown: current.shown + 1 })
  // Commands run while a question waited don't count: the answer shows one beat, not all of them.
  const pick: GuidePace['pick'] = (predict, option, shown) =>
    setPace({ key, shown, picks: { ...current.picks, [predict]: option } })
  useCommandResults(advance)
  return { shown: current.shown, picks: current.picks, advance, pick }
}
