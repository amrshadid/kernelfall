import { useMemo } from 'react'
import { getContent } from '#config'
import { useProgressStore } from '#store/progress.store'
import type { CodexEntry } from '#types/definitions/codex'
import { collectCodex } from '#utils/codex/index'

/** The Codex cards the player has filed, in the order they were earned. */
export function useCodex(): readonly CodexEntry[] {
  const progress = useProgressStore((state) => state.progress)
  return useMemo(() => collectCodex(progress, getContent()), [progress])
}
