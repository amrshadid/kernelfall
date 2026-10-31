import { describe, expect, it } from 'vitest'
import { contentOf, EXAMPLE_LEVEL, exampleContent, exampleLevel, FOLLOW_UP_LEVEL, helloRunEvents } from '#test/index'
import type { LevelChecker } from '#types/definitions/checker'
import type { PlacementCheck } from '#types/definitions/placement'
import { judgePlacement, mergePlacement, placementResult } from '#utils/placement/placement.util'

// The example level's checker reports prints-hello and exits-cleanly; its follow-up has no checker.
const CHECK: PlacementCheck = {
  offer: 'Show me, and walk on.',
  minutes: 5,
  tasks: [
    { levelId: EXAMPLE_LEVEL.id, task: 'Print hello.', files: ['hello.c'], objectives: ['prints-hello'] },
    { levelId: FOLLOW_UP_LEVEL.id, task: 'Exit with a status.', files: [], objectives: ['prints-hello'] },
  ],
}

describe('judgePlacement and mergePlacement', () => {
  it("judges each task with its level's own checker, keeping only the objectives it lists", () => {
    expect(judgePlacement(exampleContent(), CHECK, { events: helloRunEvents() })).toEqual(
      new Map([
        [EXAMPLE_LEVEL.id, new Set(['prints-hello'])],
        [FOLLOW_UP_LEVEL.id, new Set()],
      ])
    )
  })

  it("judges by the level's whole checker: its declared checks and its checker.ts together", () => {
    const level = exampleLevel({
      objectives: [
        { id: 'prints-hello', text: 'Prints hello.', check: { kind: 'wrote', fd: 1, text: { equals: 'hello\n' } } },
        { id: 'exits-cleanly', text: 'Exits with status 0.' },
      ],
    })
    const exits: LevelChecker = { check: () => ({ objectivesMet: ['exits-cleanly'], taint: [] }) }
    const check: PlacementCheck = {
      ...CHECK,
      tasks: [{ levelId: level.id, task: 'Print hello.', files: [], objectives: ['prints-hello', 'exits-cleanly'] }],
    }

    expect(judgePlacement(contentOf([level], { [level.id]: exits }), check, { events: helloRunEvents() })).toEqual(
      new Map([[level.id, new Set(['prints-hello', 'exits-cleanly'])]])
    )
  })

  it('keeps what an earlier command met, as a level does', () => {
    const earlier = new Map([[EXAMPLE_LEVEL.id, new Set(['prints-hello'])]])
    const later = new Map([[FOLLOW_UP_LEVEL.id, new Set(['exit-status'])]])

    expect(mergePlacement(earlier, later)).toEqual(
      new Map([
        [EXAMPLE_LEVEL.id, new Set(['prints-hello'])],
        [FOLLOW_UP_LEVEL.id, new Set(['exit-status'])],
      ])
    )
  })
})

describe('placementResult', () => {
  it('places the player past every passed task and sends them to the first failed one', () => {
    const met = new Map([[EXAMPLE_LEVEL.id, new Set(['prints-hello'])]])

    expect(placementResult(CHECK, met)).toEqual({ placed: [EXAMPLE_LEVEL.id], sendTo: FOLLOW_UP_LEVEL.id })
  })

  it('sends the player nowhere when every task passed', () => {
    const met = new Map([
      [EXAMPLE_LEVEL.id, new Set(['prints-hello'])],
      [FOLLOW_UP_LEVEL.id, new Set(['prints-hello'])],
    ])

    expect(placementResult(CHECK, met)).toEqual({ placed: [EXAMPLE_LEVEL.id, FOLLOW_UP_LEVEL.id], sendTo: null })
  })
})
