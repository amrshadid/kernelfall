import type { LevelDefinition, LevelRunState, TaintEvent } from '@kernelfall/game/types'
import { createLevelRun } from '@kernelfall/game/utils'
import { appContent } from '@kernelfall/levels/utils'
import { describe, expect, it, vi } from 'vitest'
import { BUILD_NOTES, HELD_PASS_LINE } from './level-guide.constants'
import { buildNoteOf, checkReportOf, type GuideInput, guideOf } from './level-guide.util'

const RUN_ANYTHING = 'act1-process-district-04-run-anything'

function runAnything(): LevelDefinition {
  const content = appContent()
  const level = content.ok ? content.value.game.level(RUN_ANYTHING) : undefined
  if (!level) {
    throw new Error(`no ${RUN_ANYTHING}`)
  }
  return level
}

const TAINT: TaintEvent = { ruleId: 'zombies-left', detail: '1 child never reaped', seq: 3 }
const NO_CHECK: GuideInput['check'] = { verdict: null, heldTaint: [], hasChecker: true }

const building = (fields: Partial<LevelRunState> = {}): LevelRunState => ({
  ...createLevelRun(RUN_ANYTHING),
  phase: 'build',
  ...fields,
})

function guideInput(fields: Partial<GuideInput> = {}): GuideInput {
  return {
    level: runAnything(),
    run: building(),
    blocks: [
      { kind: 'line', speaker: 'init', text: 'Run anything.' },
      { kind: 'code', text: 'fork();' },
    ],
    shown: 'build',
    reviewing: null,
    objectives: [],
    check: NO_CHECK,
    actions: [],
    runChip: () => undefined,
    placement: null,
    ...fields,
  }
}

describe('checkReportOf', () => {
  it('reports nothing before the first judged run, or outside Build it', () => {
    expect(checkReportOf(building(), NO_CHECK, 3)).toBeNull()
    const verdict = { passed: false, missing: [], taint: [] }
    expect(checkReportOf(building({ phase: 'watch' }), { ...NO_CHECK, verdict }, 3)).toBeNull()
  })

  it("lists what's still missing and the Taint the run would add, with init's word on a held pass", () => {
    const verdict = { passed: false, missing: [{ id: 'reaps', text: 'Reaps its children.' }], taint: [TAINT] }
    expect(checkReportOf(building({ attempts: 2 }), { ...NO_CHECK, verdict, heldTaint: [TAINT] }, 3)).toEqual({
      heading: 'run 2 · 2 of 3 met',
      missing: ['Reaps its children.'],
      taint: ['zombies-left: 1 child never reaped'],
      held: HELD_PASS_LINE,
    })
  })
})

describe('buildNoteOf', () => {
  it('says how the level is judged while building, and nothing otherwise', () => {
    expect(buildNoteOf(true, true)).toBe(BUILD_NOTES.checked)
    expect(buildNoteOf(true, false)).toBe(BUILD_NOTES.unchecked)
    expect(buildNoteOf(false, true)).toBeNull()
  })
})

describe('guideOf', () => {
  it("splits the step's story into lines and code, and links the level's Codex cards over the level", () => {
    const guide = guideOf(guideInput())
    expect(guide.stepLabel).toBe('Build it')
    expect(guide.lines).toEqual([{ speaker: 'init', text: 'Run anything.' }])
    expect(guide.code).toEqual(['fork();'])
    expect(guide.codex.every((card) => card.href.startsWith(`#/play/${RUN_ANYTHING}`))).toBe(true)
    expect(guide.seeAlso.every((page) => /\(\d\)$/.test(page.term))).toBe(true)
    expect(guide.note).toBe(BUILD_NOTES.checked)
  })

  it('shows only the hints revealed, each named by its tier', () => {
    const guide = guideOf(guideInput({ run: building({ hintsRevealed: 2 }) }))
    expect(guide.hints.map((hint) => hint.tier)).toEqual(['a nudge', 'the concept'])
  })

  it('looks back at a done step without the check report or the build note', () => {
    const verdict = { passed: false, missing: [], taint: [] }
    const guide = guideOf(guideInput({ shown: 'scene', reviewing: 'scene', check: { ...NO_CHECK, verdict } }))
    expect(guide.reviewNote).toBe('Looking again at Scene. Your progress is kept.')
    expect(guide.checkReport).toBeNull()
    expect(guide.note).toBeNull()
  })

  it("offers the level's commands while building: a whole line runs, a bare name only names the tool", () => {
    const runChip = vi.fn()
    const level = {
      ...runAnything(),
      chips: [
        { command: 'ls /bin', explain: 'list /bin' },
        { command: 'wc', explain: 'count lines' },
      ],
    }
    const guide = guideOf(guideInput({ level, runChip }))
    expect(guide.chips.map((chip) => [chip.command, chip.onRun !== null])).toEqual([
      ['ls /bin', true],
      ['wc', false],
    ])
    guide.chips[0]?.onRun?.()
    expect(runChip).toHaveBeenCalledWith('ls /bin')
    expect(guideOf(guideInput({ level, shown: 'scene', run: building({ phase: 'scene' }) })).chips).toEqual([])
  })

  it("shows init's placement offer on the scene only", () => {
    const placement = { offer: 'Show me.', minutes: 8, href: '#/placement/prologue/machine-in-section' }
    const scene = building({ phase: 'scene' })
    expect(guideOf(guideInput({ placement, shown: 'scene', run: scene })).placement).toEqual(placement)
    expect(guideOf(guideInput({ placement })).placement).toBeNull()
  })
})
