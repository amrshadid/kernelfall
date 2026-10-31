import { describe, expect, it } from 'vitest'
import type { TaintEntry } from '#types/definitions/taint'
import { CLEAN_REBOOT_MAX_TAINT, MAX_LEVEL_TAINT, UNSTABLE_REBOOT_MAX_TAINT } from '#types/definitions/taint'
import { levelTaint, replaceLevelTaint, selectEnding, totalTaint } from '#utils/taint/taint-ledger.util'

const entry = (levelId: string, points: number): TaintEntry => ({
  levelId,
  ruleId: 'leak',
  kind: 'memory_leak',
  points,
  detail: 'a buffer was never freed',
})

describe('Taint ledger', () => {
  it('sums Taint per level and in total', () => {
    const ledger = [entry('a', 2), entry('a', 3), entry('b', 4)]
    expect(levelTaint(ledger, 'a')).toBe(5)
    expect(totalTaint(ledger)).toBe(9)
    expect(totalTaint(ledger, new Set(['b']))).toBe(4)
  })

  it("caps each level's Taint, in the level total and the overall total", () => {
    const ledger = [entry('a', 8), entry('a', 7), entry('b', 1)]
    expect(levelTaint(ledger, 'a')).toBe(MAX_LEVEL_TAINT)
    expect(totalTaint(ledger)).toBe(MAX_LEVEL_TAINT + 1)
  })

  it('keeps only the latest completion of a level', () => {
    const ledger = replaceLevelTaint([entry('a', 2), entry('b', 4)], 'a', [entry('a', 1)])
    expect(levelTaint(ledger, 'a')).toBe(1)
    expect(replaceLevelTaint(ledger, 'a', [])).toEqual([entry('b', 4)])
  })
})

describe('selectEnding', () => {
  it('maps total Taint to the three endings at the thresholds', () => {
    expect(selectEnding(0)).toBe('clean_reboot')
    expect(selectEnding(CLEAN_REBOOT_MAX_TAINT)).toBe('clean_reboot')
    expect(selectEnding(CLEAN_REBOOT_MAX_TAINT + 1)).toBe('unstable_reboot')
    expect(selectEnding(UNSTABLE_REBOOT_MAX_TAINT)).toBe('unstable_reboot')
    expect(selectEnding(UNSTABLE_REBOOT_MAX_TAINT + 1)).toBe('dangling_survives')
  })
})
