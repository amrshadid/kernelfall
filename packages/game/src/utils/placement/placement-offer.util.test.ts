import { describe, expect, it } from 'vitest'
import type { ActOutline } from '#types/definitions/outline'
import type { PlacementCheck } from '#types/definitions/placement'
import type { Progress } from '#types/definitions/progress'
import { placementOfferAt } from '#utils/placement/placement-offer.util'
import { emptyProgress } from '#utils/progress/index'

const CHECK: PlacementCheck = {
  offer: "You've seen inside a machine before? Show me, and go straight to the stalled one.",
  minutes: 8,
  tasks: [
    { levelId: 'p5', task: 'Complete myuname.c.', files: ['myuname.c'], objectives: ['asks-uname', 'exits-zero'] },
    { levelId: 'p6', task: 'Read the driver link.', files: [], objectives: ['reads-disk-driver'] },
  ],
}

const ACTS = [
  {
    act: 'prologue',
    name: 'Prologue',
    regions: [{ id: 'machine-in-section', name: 'The Machine in Section', placement: CHECK, slots: [] }],
  },
] as unknown as readonly ActOutline[]

function startedOn(levelId: string): Progress {
  const progress = emptyProgress()
  return {
    ...progress,
    levels: [{ levelId, firstStartedAt: 0, completedAt: null, code: {} }] as unknown as Progress['levels'],
  }
}

describe('placementOfferAt', () => {
  it("offers the region's check on its first skippable level", () => {
    expect(placementOfferAt(ACTS, 'p5', emptyProgress())).toEqual({
      act: 'prologue',
      regionId: 'machine-in-section',
      regionName: 'The Machine in Section',
      check: CHECK,
    })
  })

  it('offers nothing on a later level, or once a level of the region was started', () => {
    expect(placementOfferAt(ACTS, 'p6', emptyProgress())).toBeNull()
    expect(placementOfferAt(ACTS, 'p5', startedOn('p6'))).toBeNull()
  })
})
