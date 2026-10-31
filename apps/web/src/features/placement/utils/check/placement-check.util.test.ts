import type { PlacementCheck } from '@kernelfall/game/types'
import { describe, expect, it } from 'vitest'
import { placementRows, placementSummary } from './placement-check.util'

const CHECK: PlacementCheck = {
  offer: "You've seen inside a machine before? Show me, and go straight to the stalled one.",
  minutes: 8,
  tasks: [
    { levelId: 'p5', task: 'Complete myuname.c.', files: ['myuname.c'], objectives: ['asks-uname', 'exits-zero'] },
    { levelId: 'p6', task: 'Read the driver link.', files: [], objectives: ['reads-disk-driver'] },
  ],
}

const NAMES: Record<string, string> = { p5: 'P.5 The Kernel Up Close', p6: 'P.6 Finding the Hardware' }
const nameOf = (id: string) => NAMES[id] ?? id

describe('placementRows', () => {
  it('counts the objectives met per task and passes a task when all are', () => {
    const rows = placementRows(CHECK, new Map([['p5', new Set(['asks-uname', 'exits-zero'])]]), nameOf)
    expect(rows.map((row) => [row.level, row.met, row.of, row.passed])).toEqual([
      ['P.5 The Kernel Up Close', 2, 2, true],
      ['P.6 Finding the Hardware', 0, 1, false],
    ])
  })
})

describe('placementSummary', () => {
  it('names the levels placed and the one to play', () => {
    expect(placementSummary({ placed: ['p5'], sendTo: 'p6' }, nameOf)).toEqual({
      placed: ['P.5 The Kernel Up Close'],
      sendTo: 'P.6 Finding the Hardware',
    })
  })
})
