import { createLevelRun } from '@kernelfall/game/utils'
import type { StoryBlock } from '@kernelfall/levels/types'
import { describe, expect, it } from 'vitest'
import { currentStepOf, guideLinesFor, objectiveStates, panelsFor } from './level-view.util'

describe('panelsFor', () => {
  const prologue = {
    act: 'prologue',
    anyCompleted: false,
    showAllPanels: false,
    hasXray: true,
    hasEditor: true,
  } as const

  it("grows the Prologue's layout with the story", () => {
    expect(panelsFor({ ...prologue, phase: 'scene' })).toEqual({ editor: false, xray: false })
    expect(panelsFor({ ...prologue, phase: 'see' })).toEqual({ editor: false, xray: true })
    expect(panelsFor({ ...prologue, phase: 'build' })).toEqual({ editor: true, xray: true })
  })

  it('never hides an unlocked panel again, and Settings can show them all', () => {
    expect(panelsFor({ ...prologue, phase: 'scene', anyCompleted: true }).xray).toBe(true)
    expect(panelsFor({ ...prologue, phase: 'scene', showAllPanels: true }).editor).toBe(true)
    expect(panelsFor({ ...prologue, act: 'act1', phase: 'scene' })).toEqual({
      editor: true,
      xray: true,
    })
  })

  it('never shows X-ray on a level that lists no view, whatever else is unlocked', () => {
    expect(panelsFor({ ...prologue, phase: 'build', hasXray: false })).toEqual({ editor: true, xray: false })
    expect(panelsFor({ ...prologue, phase: 'build', hasXray: false, showAllPanels: true }).xray).toBe(false)
  })

  it('never shows the editor on a level with no files to edit', () => {
    expect(panelsFor({ ...prologue, phase: 'build', hasEditor: false }).editor).toBe(false)
    expect(panelsFor({ ...prologue, act: 'act1', phase: 'build', hasEditor: false, showAllPanels: true }).editor).toBe(
      false
    )
  })
})

describe('guideLinesFor', () => {
  const line = (text: string): StoryBlock => ({ kind: 'line', speaker: 'init', text })
  const story = new Map([
    ['scene', [line('scene')]],
    ['debrief', [line('debrief')]],
  ])

  it("uses the step's own section, else falls back", () => {
    expect(guideLinesFor('scene', story)).toEqual([line('scene')])
    expect(guideLinesFor('build', story)).toEqual([line('scene')])
    expect(guideLinesFor('card', story)).toEqual([line('debrief')])
    expect(guideLinesFor('see', undefined)).toEqual([])
  })
})

describe('objectiveStates', () => {
  const objectives = [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
  ]

  it('leaves everything open before the first run', () => {
    expect(objectiveStates(objectives, createLevelRun('x')).map((o) => o.passed)).toEqual([false, false])
  })

  it("ticks what the last verdict didn't list as missing", () => {
    const run = {
      ...createLevelRun('x'),
      lastVerdict: { passed: false, missing: [{ id: 'b', text: 'B' }], taint: [] },
    }
    expect(objectiveStates(objectives, run).map((o) => o.passed)).toEqual([true, false])
  })

  it('ticks everything once the level has an outcome', () => {
    const run = {
      ...createLevelRun('x'),
      outcome: { via: 'reference' as const, taint: [], hintsRevealed: 3, score: 0 },
    }
    expect(objectiveStates(objectives, run).every((o) => o.passed)).toBe(true)
  })
})

describe('currentStepOf', () => {
  it('shows oops as Build it and a finished level on the card', () => {
    expect(currentStepOf('oops')).toBe('build')
    expect(currentStepOf('complete')).toBe('card')
  })
})
