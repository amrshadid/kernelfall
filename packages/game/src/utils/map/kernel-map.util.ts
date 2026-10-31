import type { GameTuning } from '#types/definitions/config'
import type { GameContent } from '#types/definitions/content'
import type { KernelMap, KernelMapLevel } from '#types/definitions/map'
import type { Progress } from '#types/definitions/progress'
import { findLevelProgress, levelStatus, progressSkills } from '#utils/progress/index'
import { levelTaint } from '#utils/taint/index'

/** The map's view of the progress: each level's status, record and Taint, in content order. */
export function kernelMap(progress: Progress, content: GameContent, tuning: GameTuning): KernelMap {
  const levels = content.levels.map((level): KernelMapLevel => {
    const status = levelStatus(progress, content, level)
    return {
      level,
      status,
      record: findLevelProgress(progress, level.id),
      taint: levelTaint(progress.taint, level.id, tuning),
      isPlayable: status !== 'locked',
    }
  })
  return {
    levels,
    byId: new Map(levels.map((entry) => [entry.level.id, entry])),
    unlockedSkills: progressSkills(progress, content),
  }
}
