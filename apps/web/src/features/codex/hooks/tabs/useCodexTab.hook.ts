import type { CodexTab } from '@features/codex/types'
import { useCallback, useState } from 'react'

export interface UseCodexTabResult {
  readonly tab: CodexTab
  readonly setTab: (tab: CodexTab) => void
}

/** Which page of the Codex shows; opening a card (a new address) always shows the cards. */
export function useCodexTab(cardId: string | null, fieldGuideOpen: boolean): UseCodexTabResult {
  const [chosen, setChosen] = useState<{ readonly tab: CodexTab; readonly cardId: string | null }>({
    tab: 'cards',
    cardId,
  })
  const setTab = useCallback((tab: CodexTab) => setChosen({ tab, cardId }), [cardId])
  const tab = fieldGuideOpen && chosen.cardId === cardId ? chosen.tab : 'cards'
  return { tab, setTab }
}
