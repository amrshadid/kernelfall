import { describe, expect, it } from 'vitest'
import type { CheckVerdict } from '#types/definitions/checker'
import { HINT_COSTS, LEVEL_BASE_SCORE } from '#types/definitions/hints'
import type { LevelRunEvent, LevelRunState } from '#types/definitions/runner'
import {
  allowedEvents,
  canTransition,
  checkpointOf,
  createLevelRun,
  resumeLevelRun,
  transition,
} from '#utils/runner/level-runner.util'

const PASS: CheckVerdict = {
  passed: true,
  missing: [],
  taint: [{ ruleId: 'ignored-write-error', detail: 'ignored' }],
}
const CLEAN_PASS: CheckVerdict = { passed: true, missing: [], taint: [] }
const FAIL: CheckVerdict = {
  passed: false,
  missing: [{ id: 'prints-hello', text: '…' }],
  taint: [],
}

const run = (...events: LevelRunEvent[]): LevelRunState =>
  events.reduce((state, event) => transition(state, event), createLevelRun('level'))

const toBuild = [{ type: 'next' }, { type: 'next' }] as const

describe('level runner', () => {
  it('walks scene → see → build → watch → card → complete', () => {
    const phases: string[] = []
    let state = createLevelRun('level')
    for (const event of [
      ...toBuild,
      { type: 'submit', verdict: CLEAN_PASS },
      { type: 'next' },
      { type: 'next' },
    ] as const) {
      phases.push(state.phase)
      state = transition(state, event)
    }
    phases.push(state.phase)
    expect(phases).toEqual(['scene', 'see', 'build', 'watch', 'card', 'complete'])
    expect(allowedEvents(state)).toEqual([])
  })

  it('stays in build after a failed check and counts the attempt', () => {
    const state = run(...toBuild, { type: 'submit', verdict: FAIL })
    expect(state).toMatchObject({ phase: 'build', attempts: 1, lastVerdict: FAIL, outcome: null })
  })

  it('holds a pass with Taint in build until the player chooses', () => {
    const state = run(...toBuild, { type: 'submit', verdict: PASS })
    expect(state).toMatchObject({ phase: 'build', outcome: null, heldPass: { taint: PASS.taint } })
    expect(allowedEvents(state)).toEqual([
      'reveal_hint',
      'submit',
      'oops',
      'use_reference',
      'accept_taint',
      'fix_first',
    ])
  })

  it('records the outcome with Taint and the hint-reduced score when the player continues as is', () => {
    const state = run(...toBuild, { type: 'reveal_hint' }, { type: 'submit', verdict: PASS }, { type: 'accept_taint' })
    expect(state.phase).toBe('watch')
    expect(state.heldPass).toBeNull()
    expect(state.outcome).toEqual({
      via: 'player',
      taint: PASS.taint,
      hintsRevealed: 1,
      score: LEVEL_BASE_SCORE - HINT_COSTS.nudge,
    })
  })

  it('lets the player fix it first: a clean run then finishes with no Taint', () => {
    const fixing = run(...toBuild, { type: 'submit', verdict: PASS }, { type: 'fix_first' })
    expect(fixing).toMatchObject({ phase: 'build', heldPass: null, outcome: null })
    const clean = transition(fixing, { type: 'submit', verdict: CLEAN_PASS })
    expect(clean).toMatchObject({ phase: 'watch', outcome: { taint: [] } })
  })

  it('replaces a held pass with the next passing run', () => {
    const held = run(...toBuild, { type: 'submit', verdict: PASS })
    expect(transition(held, { type: 'submit', verdict: CLEAN_PASS })).toMatchObject({
      phase: 'watch',
      heldPass: null,
      outcome: { taint: [] },
    })
  })

  it('offers the two choices only while a pass is held', () => {
    const building = run(...toBuild)
    expect(transition(building, { type: 'accept_taint' })).toBe(building)
    expect(transition(building, { type: 'fix_first' })).toBe(building)
  })

  it('reveals at most three hints, only while building', () => {
    expect(canTransition(createLevelRun('level'), 'reveal_hint')).toBe(false)
    const hint = { type: 'reveal_hint' } as const
    const state = run(...toBuild, hint, hint, hint)
    expect(state.hintsRevealed).toBe(3)
    expect(transition(state, hint)).toBe(state)
    expect(allowedEvents(state)).toEqual(['submit', 'oops', 'use_reference'])
  })

  it('goes to oops on a crash and respawns into build without other cost', () => {
    const crashed = run(...toBuild, { type: 'oops', report: { text: 'BUG: kernel NULL pointer' } })
    expect(crashed).toMatchObject({ phase: 'oops', oopses: 1 })
    expect(allowedEvents(crashed)).toEqual(['respawn', 'use_reference'])
    const back = transition(crashed, { type: 'respawn' })
    expect(back).toMatchObject({ phase: 'build', oops: null, outcome: null })
  })

  it('never dead-ends: the reference version continues with zero Taint and no score', () => {
    const crashed = run(...toBuild, { type: 'oops', report: { text: 'Oops' } })
    const state = transition(crashed, { type: 'use_reference' })
    expect(state.phase).toBe('watch')
    expect(state.outcome).toEqual({ via: 'reference', taint: [], hintsRevealed: 0, score: 0 })
  })

  it("ignores events that don't apply, returning the same state", () => {
    const state = createLevelRun('level')
    expect(transition(state, { type: 'submit', verdict: PASS })).toBe(state)
    expect(transition(state, { type: 'respawn' })).toBe(state)
  })

  it('resumes from a checkpoint, leaving an oops for build', () => {
    const crashed = run(...toBuild, { type: 'reveal_hint' }, { type: 'oops', report: { text: 'Oops' } })
    const resumed = resumeLevelRun('level', checkpointOf(crashed), null)
    expect(resumed).toMatchObject({ phase: 'build', hintsRevealed: 1, oopses: 1, oops: null })
  })
})
