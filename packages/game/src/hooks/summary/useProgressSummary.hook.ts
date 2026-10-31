import { useMemo } from 'react'
import { getContent, getGameConfig } from '#config'
import { useProgressStore } from '#store/progress.store'
import type { ProgressSummary } from '#types/definitions/summary'
import { summarizeProgress } from '#utils/summary/index'

/** Completion per act and overall, skills, Codex, achievements, Taint and the projected ending. */
export function useProgressSummary(): ProgressSummary {
  const progress = useProgressStore((state) => state.progress)
  return useMemo(() => summarizeProgress(progress, getContent(), getGameConfig()), [progress])
}
