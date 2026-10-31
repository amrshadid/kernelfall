import { describe, expect, it } from 'vitest'
import { EXAMPLE_CHECKER, EXAMPLE_LEVEL, helloRunEvents } from '#test/index'
import type { LevelChecker } from '#types/definitions/checker'
import { evaluateCheck, priceTaint } from '#utils/checker/evaluate-check.util'

describe('evaluateCheck', () => {
  it('passes a clean run with no Taint', () => {
    expect(evaluateCheck(EXAMPLE_LEVEL, EXAMPLE_CHECKER, { events: helloRunEvents() })).toEqual({
      passed: true,
      missing: [],
      taint: [],
    })
  })

  it('passes a hacky run but reports its Taint with the revealing event', () => {
    const verdict = evaluateCheck(EXAMPLE_LEVEL, EXAMPLE_CHECKER, {
      events: helloRunEvents({ failedWriteFirst: true }),
    })
    expect(verdict.passed).toBe(true)
    expect(verdict.taint).toEqual([expect.objectContaining({ ruleId: 'ignored-write-error', seq: 2 })])
    expect(priceTaint(EXAMPLE_LEVEL, verdict.taint)).toEqual([
      expect.objectContaining({ levelId: EXAMPLE_LEVEL.id, kind: 'ignored_error', points: 2 }),
    ])
  })

  it("lists the objectives that weren't met", () => {
    const verdict = evaluateCheck(EXAMPLE_LEVEL, EXAMPLE_CHECKER, { events: [] })
    expect(verdict.passed).toBe(false)
    expect(verdict.missing.map((objective) => objective.id)).toEqual(['prints-hello', 'exits-cleanly'])
  })

  it('treats unknown objective or rule ids as a bug in the level', () => {
    const badObjective: LevelChecker = { check: () => ({ objectivesMet: ['nope'], taint: [] }) }
    const badRule: LevelChecker = {
      check: () => ({ objectivesMet: [], taint: [{ ruleId: 'nope', detail: '?' }] }),
    }
    expect(() => evaluateCheck(EXAMPLE_LEVEL, badObjective, { events: [] })).toThrow(/objective/)
    expect(() => evaluateCheck(EXAMPLE_LEVEL, badRule, { events: [] })).toThrow(/Taint rule/)
  })
})
