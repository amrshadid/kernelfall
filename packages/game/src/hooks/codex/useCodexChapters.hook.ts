import { useMemo } from 'react'
import { getContent } from '#config'
import { useProgressStore } from '#store/progress.store'
import type { CodexChapter } from '#types/definitions/codex'
import { codexChapters } from '#utils/codex/index'

/** The whole Codex by region, in play order, with each card filed, seen or hidden for the player. */
export function useCodexChapters(): readonly CodexChapter[] {
  const progress = useProgressStore((state) => state.progress)
  return useMemo(() => codexChapters(progress, getContent()), [progress])
}
