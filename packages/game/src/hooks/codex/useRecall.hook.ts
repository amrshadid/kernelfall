import { useCallback, useMemo } from 'react'
import { getContent, getGameNow } from '#config'
import { useAnnounceProgress } from '#hooks/saves/useAnnounceProgress.hook'
import { useProgressStore } from '#store/progress.store'
import type { LevelId } from '#types/definitions/level'
import type { RecallDeck } from '#types/definitions/recall'
import { markRecall, recallDeck } from '#utils/recall/index'

const SOURCE = 'game/recall'

export interface UseRecallResult {
  readonly deck: RecallDeck
  /** Keeps the player's own call on a card ("I knew it" or not), saved with the progress. */
  readonly mark: (cardId: string, knew: boolean) => Promise<void>
}

/** The recall cards for the end of a level. The deck is dealt once per level, so marking a card doesn't reshuffle it. */
export function useRecall(levelId: LevelId): UseRecallResult {
  const epoch = useProgressStore((state) => state.epoch)
  const { announceProgress } = useAnnounceProgress()

  // biome-ignore lint/correctness/useExhaustiveDependencies: a replaced progress (open, import, reset) deals again
  const deck = useMemo(() => recallDeck(useProgressStore.getState().progress, getContent(), levelId), [levelId, epoch])

  const mark = useCallback(
    async (cardId: string, knew: boolean) => {
      const store = useProgressStore.getState()
      store.setProgress(markRecall(store.progress, cardId, knew, getGameNow()))
      await announceProgress(SOURCE)
    },
    [announceProgress]
  )

  return useMemo(() => ({ deck, mark }), [deck, mark])
}
