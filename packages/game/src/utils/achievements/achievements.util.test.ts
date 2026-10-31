import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL, exampleContent, FOLLOW_UP_LEVEL } from '#test/index'
import type { Achievement } from '#types/definitions/achievements'
import type { LevelProgress, Progress } from '#types/definitions/progress'
import { ACHIEVEMENTS } from '#utils/achievements/achievement-catalog.util'
import { newlyEarned, unlockAchievements } from '#utils/achievements/achievements.util'
import { emptyProgress } from '#utils/progress/index'

const content = exampleContent()

function completed(levelId: string, taint = 0): LevelProgress {
  const result = {
    via: 'player' as const,
    score: 70,
    taint,
    hintsRevealed: 1,
    attempts: 6,
    oopses: 0,
  }
  return {
    levelId,
    firstStartedAt: 0,
    completedAt: 1,
    activeMs: 0,
    attempts: 6,
    oopses: 0,
    run: null,
    lastResult: result,
    best: result,
    code: {},
    labSnapshot: null,
  }
}

const earnedIds = (progress: Progress) =>
  newlyEarned(ACHIEVEMENTS, { progress, content }).map((achievement) => achievement.id)

describe('achievements', () => {
  it('earns nothing on a new game', () => {
    expect(earnedIds(emptyProgress())).toEqual([])
  })

  it('earns Spotless only when a whole act is clean', () => {
    const progress: Progress = {
      ...emptyProgress(),
      levels: [completed(EXAMPLE_LEVEL.id), completed(FOLLOW_UP_LEVEL.id)],
      completionOrder: [EXAMPLE_LEVEL.id, FOLLOW_UP_LEVEL.id],
    }
    expect(earnedIds(progress)).toEqual(['first-repair', 'clean-build', 'try-try-again', 'spotless-act'])
    const tainted: Progress = {
      ...progress,
      taint: [{ levelId: FOLLOW_UP_LEVEL.id, ruleId: 'r', kind: 'memory_leak', points: 1, detail: 'd' }],
    }
    expect(earnedIds(tainted)).not.toContain('spotless-act')
  })

  it('records each achievement once, with its time', () => {
    const always: Achievement = { id: 'x', title: 'X', description: '', isEarned: () => true }
    const first = unlockAchievements(emptyProgress(), content, [always], 42)
    expect(first.progress.achievements).toEqual([{ id: 'x', unlockedAt: 42 }])
    const again = unlockAchievements(first.progress, content, [always], 43)
    expect(again.unlocked).toEqual([])
    expect(again.progress).toBe(first.progress)
  })
})
