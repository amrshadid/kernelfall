import type { ServiceResponse } from '@kernelfall/core/types'
import { useMemo } from 'react'
import { getGameConfig } from '#config'
import { useRunDispatch } from '#hooks/level/useRunDispatch.hook'
import { useProgressStore } from '#store/progress.store'
import type { HintTier, RevealedHint } from '#types/definitions/hints'
import { HINT_TIERS } from '#types/definitions/hints'
import type { DispatchResult } from '#types/definitions/session'
import { nextHintTier } from '#utils/hints/index'
import { canTransition } from '#utils/runner/index'

export interface UseHintsResult {
  /** Hints shown so far for the active level, in order (nudge, concept, spot). */
  readonly revealed: readonly RevealedHint[]
  /** The next tier to reveal, or null once all three are shown. */
  readonly next: HintTier | null
  /** The score the next hint costs (hints never add Taint). */
  readonly nextCost: number
  readonly canReveal: boolean
  readonly reveal: () => Promise<ServiceResponse<DispatchResult>>
}

/** init's three hints for the active level: what's shown, what's next and what it costs. */
export function useHints(): UseHintsResult {
  const active = useProgressStore((state) => state.active)
  const { dispatchRun } = useRunDispatch()

  return useMemo(() => {
    const count = active?.run.hintsRevealed ?? 0
    const next = nextHintTier(count)
    const texts = active?.level.hints
    return {
      revealed: HINT_TIERS.slice(0, count).map((tier, index) => ({
        tier,
        text: texts?.[index] ?? '',
      })),
      next,
      nextCost: next ? getGameConfig().hintCosts[next] : 0,
      canReveal: active !== null && canTransition(active.run, 'reveal_hint'),
      reveal: () => dispatchRun({ type: 'reveal_hint' }),
    }
  }, [active, dispatchRun])
}
