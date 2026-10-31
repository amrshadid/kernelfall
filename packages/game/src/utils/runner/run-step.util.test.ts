import { describe, expect, it } from 'vitest'
import { GAME_EVENTS } from '#events/types'
import { EXAMPLE_LEVEL, exampleContent } from '#test/index'
import type { Achievement } from '#types/definitions/achievements'
import type { CheckVerdict } from '#types/definitions/checker'
import { DEFAULT_GAME_OPTIONS } from '#types/definitions/config'
import type { LevelRunEvent, LevelRunState } from '#types/definitions/runner'
import { emptyProgress, findLevelProgress, startLevel } from '#utils/progress/index'
import { transition } from '#utils/runner/level-runner.util'
import { activeTimeSince, runStepEmissions, stepActiveLevel } from '#utils/runner/run-step.util'

const NOW = 5_000
const PLAY_MS = 1_500
const CAP_MS = 1_000
const CLEAN_PASS: CheckVerdict = { passed: true, missing: [], taint: [] }
const ALWAYS: Achievement = { id: 'always', title: 'Always', description: '', isEarned: () => true }

const started = startLevel(emptyProgress(), EXAMPLE_LEVEL, 0)

const runOf = (...events: LevelRunEvent[]): LevelRunState =>
  events.reduce((state, event) => transition(state, event), started.run)

const step = (event: LevelRunEvent, run = started.run, activeMs: number | null = null) =>
  stepActiveLevel({
    progress: started.progress,
    active: { level: EXAMPLE_LEVEL, run },
    event,
    options: { ...DEFAULT_GAME_OPTIONS, achievements: [ALWAYS] },
    content: exampleContent(),
    now: NOW,
    activeMs,
  })

describe('activeTimeSince', () => {
  it('counts the time since the last activity, capped', () => {
    expect(activeTimeSince(NOW - PLAY_MS, NOW, CAP_MS * 2)).toBe(PLAY_MS)
    expect(activeTimeSince(NOW - PLAY_MS, NOW, CAP_MS)).toBe(CAP_MS)
  })

  it('is null while nothing is timed', () => {
    expect(activeTimeSince(null, NOW, CAP_MS)).toBeNull()
  })
})

describe('stepActiveLevel', () => {
  it("is null for an event that doesn't apply in this phase", () => {
    expect(step({ type: 'reveal_hint' })).toBeNull()
  })

  it('moves the run, folds it into the progress and unlocks what it earned', () => {
    const stepped = step({ type: 'next' })

    expect(stepped?.after.phase).toBe('see')
    expect(stepped?.progress.lastActive).toEqual({ levelId: EXAMPLE_LEVEL.id, phase: 'see' })
    expect(stepped?.unlocked).toEqual([ALWAYS])
    expect(stepped?.progress.achievements).toEqual([{ id: ALWAYS.id, unlockedAt: NOW }])
  })

  it('counts the play time before the step, only when it is timed', () => {
    const activeMsOf = (activeMs: number | null) =>
      findLevelProgress(step({ type: 'next' }, started.run, activeMs)?.progress ?? emptyProgress(), EXAMPLE_LEVEL.id)
        ?.activeMs

    expect(activeMsOf(PLAY_MS)).toBe(PLAY_MS)
    expect(activeMsOf(null)).toBe(0)
  })
})

describe('runStepEmissions', () => {
  const build = runOf({ type: 'next' }, { type: 'next' })

  it('announces a revealed hint with its tier', () => {
    const after = transition(build, { type: 'reveal_hint' })

    expect(runStepEmissions({ before: build, after, unlocked: [], lastResult: null, at: NOW })).toEqual([
      { name: GAME_EVENTS.HINT_REVEALED, payload: { levelId: EXAMPLE_LEVEL.id, tier: 'nudge', at: NOW } },
    ])
  })

  it('announces the completion with the saved Taint, then each achievement', () => {
    const after = transition(build, { type: 'submit', verdict: CLEAN_PASS })
    const lastResult = { via: 'player', score: 100, taint: 3, hintsRevealed: 0, attempts: 1, oopses: 0 } as const

    const emissions = runStepEmissions({ before: build, after, unlocked: [ALWAYS], lastResult, at: NOW })

    expect(emissions.map((emission) => emission.name)).toEqual([
      GAME_EVENTS.LEVEL_COMPLETED,
      GAME_EVENTS.ACHIEVEMENT_UNLOCKED,
    ])
    expect(emissions[0]?.payload).toMatchObject({ levelId: EXAMPLE_LEVEL.id, via: 'player', taint: 3, at: NOW })
    expect(emissions[1]?.payload).toEqual({ achievementId: ALWAYS.id, title: ALWAYS.title, at: NOW })
  })

  it('announces nothing for a plain move', () => {
    const after = transition(started.run, { type: 'next' })
    expect(runStepEmissions({ before: started.run, after, unlocked: [], lastResult: null, at: NOW })).toEqual([])
  })
})
