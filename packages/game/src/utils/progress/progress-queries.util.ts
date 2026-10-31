import type { GameContent } from '#types/definitions/content'
import type { LevelDefinition, LevelId, SkillId } from '#types/definitions/level'
import type { LevelProgress, LevelResult, LevelStatus, Progress } from '#types/definitions/progress'
import { isLevelPlayable, unlockedSkills } from '#utils/skills/index'

export function emptyProgress(): Progress {
  return { levels: [], completionOrder: [], taint: [], achievements: [], lastActive: null }
}

export function findLevelProgress(progress: Progress, levelId: LevelId): LevelProgress | undefined {
  return progress.levels.find((level) => level.levelId === levelId)
}

export function completedLevelIds(progress: Progress): ReadonlySet<LevelId> {
  return new Set(progress.completionOrder)
}

export function progressSkills(progress: Progress, content: GameContent): ReadonlySet<SkillId> {
  return unlockedSkills(content.levels, completedLevelIds(progress))
}

export function levelStatus(progress: Progress, content: GameContent, level: LevelDefinition): LevelStatus {
  const record = findLevelProgress(progress, level.id)
  if (record?.completedAt != null) {
    return 'completed'
  }
  if (record) {
    return 'in_progress'
  }
  return isLevelPlayable(level, progressSkills(progress, content)) ? 'available' : 'locked'
}

/**
 * Orders results: finishing yourself beats the reference version, then less
 * Taint, then a higher score.
 */
export function betterResult(current: LevelResult | null, candidate: LevelResult): LevelResult {
  if (!current) {
    return candidate
  }
  if (current.via !== candidate.via) {
    return candidate.via === 'player' ? candidate : current
  }
  if (current.taint !== candidate.taint) {
    return candidate.taint < current.taint ? candidate : current
  }
  return candidate.score > current.score ? candidate : current
}
