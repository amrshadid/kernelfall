import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL } from '#test/index'
import type { CheckVerdict } from '#types/definitions/checker'
import { mergeVerdicts } from '#utils/checker/merge-verdicts.util'

const [PRINTS, EXITS] = EXAMPLE_LEVEL.objectives
if (!PRINTS || !EXITS) {
  throw new Error('the example level has two objectives')
}
const missing = (...objectives: CheckVerdict['missing']): CheckVerdict => ({
  passed: objectives.length === 0,
  missing: objectives,
  taint: [],
})

describe('mergeVerdicts', () => {
  it('takes the first verdict as it is', () => {
    const first = missing(PRINTS)
    expect(mergeVerdicts(null, first)).toBe(first)
  })

  it('keeps an objective met by any run met, and passes once every one has been', () => {
    expect(mergeVerdicts(missing(PRINTS), missing(EXITS))).toEqual(missing())
    expect(mergeVerdicts(missing(PRINTS, EXITS), missing(EXITS))).toEqual(missing(EXITS))
  })

  it("keeps only the latest run's Taint, so fixing the code clears it", () => {
    const tainted = { ...missing(), taint: [{ ruleId: 'ignored-write-error', detail: 'ignored' }] }

    expect(mergeVerdicts(tainted, missing()).taint).toEqual([])
    expect(mergeVerdicts(missing(), tainted).taint).toEqual(tainted.taint)
  })
})
