import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL, exampleContent, FOLLOW_UP_LEVEL } from '#test/index'
import { DEFAULT_GAME_TUNING } from '#types/definitions/config'
import type { LevelProgress, Progress } from '#types/definitions/progress'
import type { TaintEntry } from '#types/definitions/taint'
import { kernelMap } from '#utils/map/kernel-map.util'
import { emptyProgress, startLevel } from '#utils/progress/index'

const content = exampleContent()
const STARTED_AT = 1_000

const leak = (points: number): TaintEntry => ({
  levelId: EXAMPLE_LEVEL.id,
  ruleId: 'ignored-write-error',
  kind: 'ignored_error',
  points,
  detail: 'write() failed and was ignored',
})

/** The example level passed with the player's code, with `taint` in the ledger. */
function completedExample(taint: readonly TaintEntry[]): Progress {
  const record: LevelProgress = {
    levelId: EXAMPLE_LEVEL.id,
    firstStartedAt: STARTED_AT,
    completedAt: STARTED_AT,
    activeMs: 0,
    attempts: 1,
    oopses: 0,
    run: null,
    lastResult: null,
    best: null,
    code: {},
    labSnapshot: null,
  }
  return { ...emptyProgress(), levels: [record], completionOrder: [EXAMPLE_LEVEL.id], taint }
}

describe('kernelMap', () => {
  it('shows a new game: the first level open, the one after it locked, nothing recorded', () => {
    const map = kernelMap(emptyProgress(), content, DEFAULT_GAME_TUNING)

    expect(map.levels.map((entry) => [entry.level.id, entry.status, entry.isPlayable, entry.taint])).toEqual([
      [EXAMPLE_LEVEL.id, 'available', true, 0],
      [FOLLOW_UP_LEVEL.id, 'locked', false, 0],
    ])
    expect(map.levels.every((entry) => entry.record === undefined)).toBe(true)
    expect(map.unlockedSkills.size).toBe(0)
  })

  it('marks a started level in progress with its record', () => {
    const { progress } = startLevel(emptyProgress(), EXAMPLE_LEVEL, STARTED_AT)
    const map = kernelMap(progress, content, DEFAULT_GAME_TUNING)

    expect(map.byId.get(EXAMPLE_LEVEL.id)).toMatchObject({
      status: 'in_progress',
      isPlayable: true,
      record: { levelId: EXAMPLE_LEVEL.id, firstStartedAt: STARTED_AT },
    })
  })

  it('unlocks the completed level skills, which opens the next level, and finds every level by id', () => {
    const map = kernelMap(completedExample([]), content, DEFAULT_GAME_TUNING)

    expect(map.byId.get(EXAMPLE_LEVEL.id)?.status).toBe('completed')
    expect(map.byId.get(FOLLOW_UP_LEVEL.id)?.status).toBe('available')
    expect([...map.byId.keys()]).toEqual([EXAMPLE_LEVEL.id, FOLLOW_UP_LEVEL.id])
    expect([...map.unlockedSkills]).toEqual(EXAMPLE_LEVEL.skills)
  })

  it("caps a level's Taint with the tuning, so one messy level can't decide the ending", () => {
    const over = DEFAULT_GAME_TUNING.maxLevelTaint
    const progress = completedExample([leak(over), leak(1)])

    expect(kernelMap(progress, content, DEFAULT_GAME_TUNING).byId.get(EXAMPLE_LEVEL.id)?.taint).toBe(over)
    const strict = { ...DEFAULT_GAME_TUNING, maxLevelTaint: 3 }
    expect(kernelMap(progress, content, strict).byId.get(EXAMPLE_LEVEL.id)?.taint).toBe(strict.maxLevelTaint)
  })
})
