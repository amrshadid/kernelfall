import type { GuidePace } from '@features/level/types'
import { useCommandResults } from '@kernelfall/machine/hooks'
import { useState } from 'react'

/**
 * How far into a step's transcript the player is. Each command they finish shows the next beat, so
 * the explanation of a result comes after the result. `key` names the step; a new one starts over.
 */
export function useGuidePace(key: string): GuidePace {
  const [pace, setPace] = useState({ key, shown: 1 })
  const shown = pace.key === key ? pace.shown : 1
  const advance = () => setPace({ key, shown: shown + 1 })
  useCommandResults(advance)
  return { shown, advance }
}
