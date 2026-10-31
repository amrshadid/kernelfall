import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL, exampleContent, FOLLOW_UP_LEVEL } from '#test/index'
import type { Progress } from '#types/definitions/progress'
import { continueTarget, levelStatusById } from '#utils/progress/continue.util'
import { emptyProgress } from '#utils/progress/progress-queries.util'

const content = exampleContent()

describe('continueTarget', () => {
  it('starts a new player at the first available level', () => {
    expect(continueTarget(emptyProgress(), content)).toEqual({
      levelId: EXAMPLE_LEVEL.id,
      phase: 'scene',
    })
  })

  it('returns to the last unfinished step', () => {
    const progress: Progress = {
      ...emptyProgress(),
      lastActive: { levelId: EXAMPLE_LEVEL.id, phase: 'build' },
    }
    expect(continueTarget(progress, content)).toEqual({
      levelId: EXAMPLE_LEVEL.id,
      phase: 'build',
    })
  })

  it('moves on once the last level is complete', () => {
    const progress = completedFirst({ levelId: EXAMPLE_LEVEL.id, phase: 'complete' })

    expect(continueTarget(progress, content)).toEqual({
      levelId: FOLLOW_UP_LEVEL.id,
      phase: 'scene',
    })
  })

  // The checker passes in build; the player may leave during watch or the debrief.
  it.each(['watch', 'card'] as const)('moves on from a completed level left in its %s step', (phase) => {
    const progress = completedFirst({ levelId: EXAMPLE_LEVEL.id, phase })

    expect(continueTarget(progress, content)).toEqual({
      levelId: FOLLOW_UP_LEVEL.id,
      phase: 'scene',
    })
  })
})

/** The first example level completed (record with completedAt, place in completionOrder), last seen at `lastActive`. */
function completedFirst(lastActive: Progress['lastActive']): Progress {
  return {
    ...emptyProgress(),
    levels: [
      {
        levelId: EXAMPLE_LEVEL.id,
        firstStartedAt: 1,
        completedAt: 2,
        activeMs: 0,
        attempts: 1,
        oopses: 0,
        run: null,
        lastResult: null,
        best: null,
        code: {},
        labSnapshot: null,
      },
    ],
    completionOrder: [EXAMPLE_LEVEL.id],
    lastActive,
  }
}

describe('levelStatusById', () => {
  it("locks unknown ids and levels whose skills aren't learned", () => {
    expect(levelStatusById(emptyProgress(), content, 'nope')).toBe('locked')
    expect(levelStatusById(emptyProgress(), content, FOLLOW_UP_LEVEL.id)).toBe('locked')
    expect(levelStatusById(emptyProgress(), content, EXAMPLE_LEVEL.id)).toBe('available')
  })
})
