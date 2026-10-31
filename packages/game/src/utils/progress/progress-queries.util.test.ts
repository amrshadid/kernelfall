import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL, exampleContent, FOLLOW_UP_LEVEL } from '#test/index'
import type { LevelResult, Progress } from '#types/definitions/progress'
import {
  betterResult,
  completedLevelIds,
  emptyProgress,
  findLevelProgress,
  levelStatus,
  progressSkills,
} from '#utils/progress/progress-queries.util'
import { startLevel } from '#utils/progress/progress-updates.util'

const content = exampleContent()
const STARTED_AT = 500
const COMPLETED_AT = 900

const started = (): Progress => startLevel(emptyProgress(), EXAMPLE_LEVEL, STARTED_AT).progress

const completed = (): Progress => {
  const progress = started()
  return {
    ...progress,
    levels: progress.levels.map((record) => ({ ...record, completedAt: COMPLETED_AT })),
    completionOrder: [EXAMPLE_LEVEL.id],
  }
}

describe('progress queries', () => {
  it('starts empty', () => {
    expect(emptyProgress()).toEqual({ levels: [], completionOrder: [], taint: [], achievements: [], lastActive: null })
  })

  it("finds a started level's record, and nothing for one never started", () => {
    expect(findLevelProgress(started(), EXAMPLE_LEVEL.id)?.firstStartedAt).toBe(STARTED_AT)
    expect(findLevelProgress(started(), FOLLOW_UP_LEVEL.id)).toBeUndefined()
  })

  it('lists completed levels and the skills they unlock', () => {
    expect([...completedLevelIds(completed())]).toEqual([EXAMPLE_LEVEL.id])
    expect(progressSkills(completed(), content).size).toBeGreaterThan(progressSkills(emptyProgress(), content).size)
  })

  it('locks a level until its prerequisites are unlocked', () => {
    expect(levelStatus(emptyProgress(), content, FOLLOW_UP_LEVEL)).toBe('locked')
    expect(levelStatus(emptyProgress(), content, EXAMPLE_LEVEL)).toBe('available')
    expect(levelStatus(started(), content, EXAMPLE_LEVEL)).toBe('in_progress')
    expect(levelStatus(completed(), content, EXAMPLE_LEVEL)).toBe('completed')
    expect(levelStatus(completed(), content, FOLLOW_UP_LEVEL)).toBe('available')
  })
})

describe('betterResult', () => {
  const result = (overrides: Partial<LevelResult>): LevelResult => ({
    via: 'player',
    score: 50,
    taint: 0,
    hintsRevealed: 0,
    attempts: 1,
    oopses: 0,
    ...overrides,
  })

  it('prefers your own code, then less Taint, then a higher score', () => {
    const own = result({})
    expect(betterResult(own, result({ via: 'reference' }))).toBe(own)
    const cleaner = result({ taint: 0, score: 10 })
    expect(betterResult(result({ taint: 3, score: 100 }), cleaner)).toBe(cleaner)
    const higher = result({ score: 90 })
    expect(betterResult(own, higher)).toBe(higher)
  })
})
