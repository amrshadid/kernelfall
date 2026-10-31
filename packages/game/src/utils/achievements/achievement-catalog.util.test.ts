import { describe, expect, it } from 'vitest'
import {
  contentOf,
  EXAMPLE_LEVEL,
  EXAMPLE_LEVEL_YAML,
  exampleContent,
  exampleLevel,
  FOLLOW_UP_LEVEL,
} from '#test/index'
import type { GameContent } from '#types/definitions/content'
import type { LevelDefinition } from '#types/definitions/level'
import type { LevelProgress, LevelResult, Progress } from '#types/definitions/progress'
import { ACHIEVEMENTS } from '#utils/achievements/achievement-catalog.util'
import { emptyProgress } from '#utils/progress/index'

const content = exampleContent()

// The catalog's thresholds, as their descriptions tell the player.
const PERSISTENT_ATTEMPTS = 5
const CODEX_COLLECTOR_CARDS = 5

const result = (overrides: Partial<LevelResult> = {}): LevelResult => ({
  via: 'player',
  score: 100,
  taint: 0,
  hintsRevealed: 0,
  attempts: 1,
  oopses: 0,
  ...overrides,
})

/** A record of `levelId`, completed with `lastResult` unless the overrides say otherwise. */
function record(levelId: string, overrides: Partial<LevelProgress> = {}): LevelProgress {
  return {
    levelId,
    firstStartedAt: 0,
    completedAt: 1,
    activeMs: 0,
    attempts: 1,
    oopses: 0,
    run: null,
    lastResult: result(),
    best: result(),
    code: {},
    labSnapshot: null,
    ...overrides,
  }
}

const progressOf = (levels: readonly LevelProgress[], extra: Partial<Progress> = {}): Progress => ({
  ...emptyProgress(),
  levels,
  completionOrder: levels.filter((level) => level.completedAt !== null).map((level) => level.levelId),
  ...extra,
})

/** Whether the achievement `id` holds for `progress`. */
function earns(id: string, progress: Progress, within: GameContent = content): boolean {
  const achievement = ACHIEVEMENTS.find((candidate) => candidate.id === id)
  if (!achievement) {
    throw new Error(`no achievement "${id}"`)
  }
  return achievement.isEarned({ progress, content: within })
}

/** A level that files `count` Codex cards. */
function levelWithCards(count: number): LevelDefinition {
  const card = EXAMPLE_LEVEL_YAML.codex[0]
  return exampleLevel({
    codex: Array.from({ length: count }, (_, index) => ({ ...card, id: `card-${index + 1}` })),
  })
}

describe('ACHIEVEMENTS', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map((achievement) => achievement.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("First Repair: a pass with the player's own code, not init's version", () => {
    expect(earns('first-repair', progressOf([record(EXAMPLE_LEVEL.id)]))).toBe(true)
    const reference = result({ via: 'reference', score: 0 })
    expect(
      earns('first-repair', progressOf([record(EXAMPLE_LEVEL.id, { lastResult: reference, best: reference })]))
    ).toBe(false)
  })

  it('counts the best result too, so passing with init later keeps an earlier own pass', () => {
    const reference = result({ via: 'reference', score: 0 })
    expect(earns('first-repair', progressOf([record(EXAMPLE_LEVEL.id, { lastResult: reference })]))).toBe(true)
  })

  it('On Your Own: an own pass with no hint revealed', () => {
    expect(earns('on-your-own', progressOf([record(EXAMPLE_LEVEL.id)]))).toBe(true)
    const hinted = result({ hintsRevealed: 1 })
    expect(earns('on-your-own', progressOf([record(EXAMPLE_LEVEL.id, { lastResult: hinted, best: hinted })]))).toBe(
      false
    )
  })

  it('Clean Build: an own pass with zero Taint', () => {
    expect(earns('clean-build', progressOf([record(EXAMPLE_LEVEL.id)]))).toBe(true)
    const tainted = result({ taint: 2 })
    expect(earns('clean-build', progressOf([record(EXAMPLE_LEVEL.id, { lastResult: tainted, best: tainted })]))).toBe(
      false
    )
  })

  it('First Oops: any crash, even in a level not passed yet', () => {
    const crashed = record(EXAMPLE_LEVEL.id, { completedAt: null, lastResult: null, best: null, oopses: 1 })
    expect(earns('first-oops', progressOf([crashed]))).toBe(true)
    expect(earns('first-oops', progressOf([record(EXAMPLE_LEVEL.id)]))).toBe(false)
  })

  it(`Try, Try Again: an own pass after ${PERSISTENT_ATTEMPTS} or more checker runs`, () => {
    const achievement = ACHIEVEMENTS.find((candidate) => candidate.id === 'try-try-again')
    expect(achievement?.description).toContain(`${PERSISTENT_ATTEMPTS} or more`)
    const after = (attempts: number) => {
      const passed = result({ attempts })
      return progressOf([record(EXAMPLE_LEVEL.id, { lastResult: passed, best: passed })])
    }
    expect(earns('try-try-again', after(PERSISTENT_ATTEMPTS))).toBe(true)
    expect(earns('try-try-again', after(PERSISTENT_ATTEMPTS - 1))).toBe(false)
  })

  describe('Spotless', () => {
    const both = [record(EXAMPLE_LEVEL.id), record(FOLLOW_UP_LEVEL.id)]

    it('needs every level of the act passed', () => {
      expect(earns('spotless-act', progressOf(both))).toBe(true)
      expect(earns('spotless-act', progressOf([record(EXAMPLE_LEVEL.id)]))).toBe(false)
    })

    it("judges the latest completion: replaying a level with init's version loses it", () => {
      const reference = result({ via: 'reference', score: 0 })
      const replayed = [record(EXAMPLE_LEVEL.id), record(FOLLOW_UP_LEVEL.id, { lastResult: reference })]
      expect(earns('spotless-act', progressOf(replayed))).toBe(false)
    })

    it("reads Taint from the ledger, not the result's own count", () => {
      const ledger = [
        { levelId: FOLLOW_UP_LEVEL.id, ruleId: 'r', kind: 'memory_leak' as const, points: 1, detail: 'leak' },
      ]
      expect(earns('spotless-act', progressOf(both, { taint: ledger }))).toBe(false)
    })
  })

  it(`Archivist: ${CODEX_COLLECTOR_CARDS} Codex cards filed`, () => {
    const enough = levelWithCards(CODEX_COLLECTOR_CARDS)
    expect(earns('archivist', progressOf([record(enough.id)]), contentOf([enough]))).toBe(true)
    const fewer = levelWithCards(CODEX_COLLECTOR_CARDS - 1)
    expect(earns('archivist', progressOf([record(fewer.id)]), contentOf([fewer]))).toBe(false)
  })
})
