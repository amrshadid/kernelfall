import { useMemo } from 'react'
import { getContent } from '#config'
import { useProgressStore } from '#store/progress.store'
import type { LastActive } from '#types/definitions/progress'
import { continueTarget } from '#utils/progress/index'

/** Where "Continue" goes: the last unfinished step, else the next playable level; null for none. */
export function useContinue(): LastActive | null {
  const progress = useProgressStore((state) => state.progress)
  return useMemo(() => continueTarget(progress, getContent()), [progress])
}
