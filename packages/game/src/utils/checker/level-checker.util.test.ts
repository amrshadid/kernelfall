import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL, helloRunEvents, shellSession } from '#test/index'
import type { LevelChecker } from '#types/definitions/checker'
import type { LevelDefinition } from '#types/definitions/level'
import { defineChecker, levelChecker } from '#utils/checker/level-checker.util'

const [PRINTS, EXITS] = EXAMPLE_LEVEL.objectives
if (!PRINTS || !EXITS) {
  throw new Error('the example level has two objectives')
}
const [WRITE_RULE] = EXAMPLE_LEVEL.taint
if (!WRITE_RULE) {
  throw new Error('the example level has a Taint rule')
}

/** The example level with every objective and its Taint rule declared. */
const DECLARED: LevelDefinition = {
  ...EXAMPLE_LEVEL,
  objectives: [
    { ...PRINTS, check: { kind: 'wrote', fd: 1, text: { equals: 'hello\n' } } },
    { ...EXITS, check: { kind: 'exit-status', status: 0 } },
  ],
  taint: [{ ...WRITE_RULE, check: { kind: 'ran-program', programs: ['sh'] } }],
}

const PRINTS_ONLY: LevelChecker = defineChecker({ check: () => ({ objectivesMet: [PRINTS.id], taint: [] }) })

describe('levelChecker', () => {
  it('is undefined for a level with no checks and no checker of its own', () => {
    expect(levelChecker(EXAMPLE_LEVEL)).toBeUndefined()
  })

  it("judges a level's declared checks from the events", () => {
    const checker = levelChecker(DECLARED)

    expect(checker?.check({ events: helloRunEvents() })).toEqual({ objectivesMet: [PRINTS.id, EXITS.id], taint: [] })
  })

  it('judges only commands that ran a process its checks look at', () => {
    const checker = levelChecker(DECLARED)

    expect(checker?.applies?.({ events: helloRunEvents() })).toBe(true)
    expect(checker?.applies?.({ events: [] })).toBe(false)
  })

  it('names declared Taint by the rule that found it', () => {
    const checker = levelChecker(DECLARED)

    expect(checker?.check({ events: shellSession() }).taint).toEqual([
      { ruleId: WRITE_RULE.id, detail: 'pid 4 ran /bin/sh', seq: 20 },
    ])
  })

  it("adds a custom checker's report to the declared one, and lets it decide what applies", () => {
    const partly: LevelDefinition = {
      ...DECLARED,
      objectives: [PRINTS, { ...EXITS, check: { kind: 'exit-status', status: 0 } }],
    }
    const custom = defineChecker({ ...PRINTS_ONLY, applies: () => true })
    const checker = levelChecker(partly, custom)

    expect(checker?.applies?.({ events: [] })).toBe(true)
    expect(checker?.check({ events: helloRunEvents() }).objectivesMet).toEqual([EXITS.id, PRINTS.id])
  })

  it("judges what the declared checks look at even when the custom checker doesn't apply", () => {
    const custom = defineChecker({ ...PRINTS_ONLY, applies: () => false })
    const checker = levelChecker(DECLARED, custom)

    expect(checker?.applies?.({ events: helloRunEvents() })).toBe(true)
    expect(checker?.applies?.({ events: [] })).toBe(false)
  })

  it("judges the player's programs for a custom checker alone that says nothing about it", () => {
    const checker = levelChecker(EXAMPLE_LEVEL, PRINTS_ONLY)

    expect(checker?.applies?.({ events: helloRunEvents() })).toBe(true)
    expect(checker?.applies?.({ events: [] })).toBe(false)
    expect(checker?.check({ events: [] })).toEqual({ objectivesMet: [PRINTS.id], taint: [] })
  })
})
