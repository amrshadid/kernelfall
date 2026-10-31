import { useMemo } from 'react'
import { getContent } from '#config'
import { useProgressStore } from '#store/progress.store'
import type { LevelId } from '#types/definitions/level'
import type { LevelProgress, LevelStatus } from '#types/definitions/progress'
import { findLevelProgress, levelStatusById } from '#utils/progress/index'

export interface UseLevelStatusResult {
  readonly status: LevelStatus
  /** The player's record for the level, or undefined if never started. */
  readonly record: LevelProgress | undefined
  readonly isPlayable: boolean
}

/** A level's status (locked, available, in progress, completed) for the map and the title. */
export function useLevelStatus(levelId: LevelId): UseLevelStatusResult {
  const progress = useProgressStore((state) => state.progress)

  return useMemo(() => {
    const status = levelStatusById(progress, getContent(), levelId)
    return {
      status,
      record: findLevelProgress(progress, levelId),
      isPlayable: status !== 'locked',
    }
  }, [progress, levelId])
}
