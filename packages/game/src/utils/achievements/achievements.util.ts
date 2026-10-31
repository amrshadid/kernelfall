import type { Achievement, AchievementContext } from '#types/definitions/achievements'
import type { GameContent } from '#types/definitions/content'
import type { EpochMs, Progress } from '#types/definitions/progress'

/** Achievements that are earned now but weren't unlocked before. */
export function newlyEarned(achievements: readonly Achievement[], context: AchievementContext): readonly Achievement[] {
  const unlocked = new Set(context.progress.achievements.map((achievement) => achievement.id))
  return achievements.filter((achievement) => !unlocked.has(achievement.id) && achievement.isEarned(context))
}

/** Records newly earned achievements; call after every progress update. */
export function unlockAchievements(
  progress: Progress,
  content: GameContent,
  achievements: readonly Achievement[],
  now: EpochMs
): { readonly progress: Progress; readonly unlocked: readonly Achievement[] } {
  const unlocked = newlyEarned(achievements, { progress, content })
  if (unlocked.length === 0) {
    return { progress, unlocked }
  }
  const records = unlocked.map((achievement) => ({ id: achievement.id, unlockedAt: now }))
  return {
    progress: { ...progress, achievements: [...progress.achievements, ...records] },
    unlocked,
  }
}
