import { describe, expect, it } from 'vitest'
import { EXAMPLE_CHECKER, EXAMPLE_LEVEL, exampleContent, FOLLOW_UP_LEVEL, helloRunEvents } from '#test/index'
import type { Progress } from '#types/definitions/progress'
import type { LevelRunEvent } from '#types/definitions/runner'
import { evaluateCheck } from '#utils/checker/evaluate-check.util'
import { emptyProgress, findLevelProgress, levelStatus } from '#utils/progress/progress-queries.util'
import {
  addActiveTime,
  applyRunStep,
  loadReferenceCode,
  placeLevels,
  restorePlayerCode,
  setLabSnapshot,
  setLevelCode,
  startLevel,
} from '#utils/progress/progress-updates.util'
import { transition } from '#utils/runner/level-runner.util'

const content = exampleContent()
const hackyPass = evaluateCheck(EXAMPLE_LEVEL, EXAMPLE_CHECKER, {
  events: helloRunEvents({ failedWriteFirst: true }),
})
const cleanPass = evaluateCheck(EXAMPLE_LEVEL, EXAMPLE_CHECKER, { events: helloRunEvents() })

/** Plays `events` from a fresh start of the example level, folding each step into progress. */
function play(progress: Progress, events: readonly LevelRunEvent[], now = 1000): Progress {
  const started = startLevel(progress, EXAMPLE_LEVEL, now)
  let current = started.progress
  let run = started.run
  for (const event of events) {
    const after = transition(run, event)
    current = applyRunStep(current, { level: EXAMPLE_LEVEL, before: run, after, now })
    run = after
  }
  return current
}

const next = { type: 'next' } as const

describe('progress', () => {
  it('starts a level with a timestamp and a checkpoint at the scene', () => {
    const progress = play(emptyProgress(), [], 500)
    expect(findLevelProgress(progress, EXAMPLE_LEVEL.id)).toMatchObject({
      firstStartedAt: 500,
      completedAt: null,
      run: { phase: 'scene', hintsRevealed: 0 },
    })
    expect(progress.lastActive).toEqual({ levelId: EXAMPLE_LEVEL.id, phase: 'scene' })
    expect(levelStatus(progress, content, EXAMPLE_LEVEL)).toBe('in_progress')
  })

  it('records counters, the completion, Taint and the best result', () => {
    const progress = play(emptyProgress(), [
      next,
      next,
      { type: 'submit', verdict: { passed: false, missing: [], taint: [] } },
      { type: 'oops', report: { text: 'Oops' } },
      { type: 'respawn' },
      { type: 'submit', verdict: hackyPass },
      { type: 'accept_taint' },
    ])
    const record = findLevelProgress(progress, EXAMPLE_LEVEL.id)
    expect(record).toMatchObject({ attempts: 2, oopses: 1, completedAt: 1000 })
    expect(record?.lastResult).toEqual({
      via: 'player',
      score: 100,
      taint: 2,
      hintsRevealed: 0,
      attempts: 2,
      oopses: 1,
    })
    expect(progress.completionOrder).toEqual([EXAMPLE_LEVEL.id])
    expect(progress.taint).toHaveLength(1)
    expect(levelStatus(progress, content, EXAMPLE_LEVEL)).toBe('completed')
    expect(levelStatus(progress, content, FOLLOW_UP_LEVEL)).toBe('available')
  })

  it('clears the run once the loop completes', () => {
    const progress = play(emptyProgress(), [next, next, { type: 'submit', verdict: cleanPass }, next, next])
    expect(findLevelProgress(progress, EXAMPLE_LEVEL.id)?.run).toBeNull()
    expect(progress.lastActive?.phase).toBe('complete')
  })

  it('replaces Taint with the latest completion but keeps the best result', () => {
    const first = play(emptyProgress(), [next, next, { type: 'submit', verdict: cleanPass }, next, next])
    const replay = play(first, [next, next, { type: 'use_reference' }], 2000)
    const record = findLevelProgress(replay, EXAMPLE_LEVEL.id)
    expect(record?.lastResult?.via).toBe('reference')
    expect(record?.best?.via).toBe('player')
    expect(record?.completedAt).toBe(1000)
    expect(replay.completionOrder).toEqual([EXAMPLE_LEVEL.id])
  })

  it('keeps code and the lab snapshot key per level', () => {
    let progress = play(emptyProgress(), [])
    progress = setLevelCode(progress, EXAMPLE_LEVEL.id, { 'hello.c': 'int main(void) {}' })
    progress = setLabSnapshot(progress, EXAMPLE_LEVEL.id, 'snap-1')
    expect(findLevelProgress(progress, EXAMPLE_LEVEL.id)).toMatchObject({
      code: { 'hello.c': 'int main(void) {}' },
      labSnapshot: 'snap-1',
    })
    expect(setLevelCode(progress, 'never-started', {})).toBe(progress)
  })

  it("keeps the player's code beside init's version, once, and restores it", () => {
    const mine = setLevelCode(play(emptyProgress(), []), EXAMPLE_LEVEL.id, { 'a.c': 'mine' })
    const loaded = loadReferenceCode(mine, EXAMPLE_LEVEL.id, { 'a.c': 'init' })
    const reloaded = loadReferenceCode(loaded, EXAMPLE_LEVEL.id, { 'a.c': 'init' })
    expect(findLevelProgress(reloaded, EXAMPLE_LEVEL.id)).toMatchObject({
      code: { 'a.c': 'init' },
      playerCode: { 'a.c': 'mine' },
    })

    const restored = restorePlayerCode(reloaded, EXAMPLE_LEVEL.id)
    expect(findLevelProgress(restored, EXAMPLE_LEVEL.id)?.code).toEqual({ 'a.c': 'mine' })
    expect(findLevelProgress(restored, EXAMPLE_LEVEL.id)?.playerCode).toBeUndefined()
    expect(restorePlayerCode(restored, EXAMPLE_LEVEL.id)).toEqual(restored)
  })

  it('adds play time, never a negative amount', () => {
    const PLAY_MS = 1_500
    const progress = addActiveTime(play(emptyProgress(), []), EXAMPLE_LEVEL.id, PLAY_MS)
    expect(findLevelProgress(addActiveTime(progress, EXAMPLE_LEVEL.id, -PLAY_MS), EXAMPLE_LEVEL.id)?.activeMs).toBe(
      PLAY_MS
    )
  })
})

describe('placeLevels', () => {
  const PLACED_AT = 7000

  it('completes unplayed levels by placement, unlocking what they teach, with no score or Taint', () => {
    const progress = placeLevels(emptyProgress(), [EXAMPLE_LEVEL.id], PLACED_AT)

    expect(findLevelProgress(progress, EXAMPLE_LEVEL.id)).toMatchObject({
      completedAt: PLACED_AT,
      lastResult: { via: 'placement', score: 0, taint: 0 },
    })
    expect(progress.completionOrder).toEqual([EXAMPLE_LEVEL.id])
    expect(progress.taint).toEqual([])
    expect(levelStatus(progress, content, FOLLOW_UP_LEVEL)).toBe('available')
  })

  it('keeps the result of a level the player already completed', () => {
    const played = play(emptyProgress(), [next, next, { type: 'submit', verdict: cleanPass }])
    const before = findLevelProgress(played, EXAMPLE_LEVEL.id)

    const progress = placeLevels(played, [EXAMPLE_LEVEL.id], PLACED_AT)

    expect(findLevelProgress(progress, EXAMPLE_LEVEL.id)).toEqual(before)
    expect(progress.completionOrder).toEqual([EXAMPLE_LEVEL.id])
  })
})
