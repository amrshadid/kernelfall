import { describe, expect, it } from 'vitest'
import { headerWidthRem } from './panel-width.util'

describe('headerWidthRem', () => {
  it("reaches from the panel's left edge to the header's rule, in rem", () => {
    expect(headerWidthRem({ headerRight: 482, ruleWidth: 2, panelLeft: 16, remPx: 16 })).toBe(29)
  })

  it('is unknown before the header or the panel is laid out', () => {
    expect(headerWidthRem({ headerRight: 0, ruleWidth: 0, panelLeft: 16, remPx: 16 })).toBeNull()
    expect(headerWidthRem({ headerRight: 482, ruleWidth: 2, panelLeft: 16, remPx: 0 })).toBeNull()
  })
})
