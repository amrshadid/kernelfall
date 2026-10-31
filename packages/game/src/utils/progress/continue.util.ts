import type { GameContent } from '#types/definitions/content'
import type { LevelId } from '#types/definitions/level'
import type { LastActive, LevelStatus, Progress } from '#types/definitions/progress'
import { levelStatus } from '#utils/progress/progress-queries.util'

/** A level's status by id; an id the content doesn't know is locked. */
export function levelStatusById(progress: Progress, content: GameContent, levelId: LevelId): LevelStatus {
  const level = content.level(levelId)
  return level ? levelStatus(progress, content, level) : 'locked'
}

/**
 * Where the title screen's "Continue" and the map's "Recommended next" go: the
 * last unfinished step of a level not yet completed, or else the first level in
 * play order that is available or in progress.
 */
export function continueTarget(progress: Progress, content: GameContent): LastActive | null {
  const last = progress.lastActive
  // A level is completed when its checker passes, before its watch and debrief are seen.
  if (last && last.phase !== 'complete' && isUnfinished(levelStatusById(progress, content, last.levelId))) {
    return last
  }
  const next = content.levels.find((level) => isUnfinished(levelStatus(progress, content, level)))
  return next ? { levelId: next.id, phase: 'scene' } : null
}

const isUnfinished = (status: LevelStatus): boolean => status === 'available' || status === 'in_progress'
