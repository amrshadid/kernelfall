import type { Progress } from '@kernelfall/game/types'
import { DEFAULT_GAME_TUNING } from '@kernelfall/game/types'
import { emptyProgress, kernelMap } from '@kernelfall/game/utils'
import { describe, expect, it } from 'vitest'
import { doneWithHelp, nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { PLAN_NOTES, TYPICAL_LEVEL_TIME } from './map-detail.constants'
import { levelTimeOf, mapDetailOf, planNoteOf, playLabelOf } from './map-detail.util'

const RUN_ANYTHING = 'act1-process-district-04-run-anything'

function detailFor(progress: Progress, levelId: string) {
  const content = realContent()
  const node = nodesFor(progress, content).find((candidate) => candidate.levelId === levelId)
  if (!node) {
    throw new Error(`no stop for ${levelId}`)
  }
  const map = kernelMap(progress, content.game, DEFAULT_GAME_TUNING)
  return mapDetailOf(node, { acts: content.acts, skills: content.game.skills, map })
}

describe('playLabelOf', () => {
  it('continues a level under way, replays a done one and plays the rest', () => {
    expect(playLabelOf({ state: 'progress' })).toBe('Continue')
    expect(playLabelOf({ state: 'clean' })).toBe('Replay')
    expect(playLabelOf({ state: 'available' })).toBe('Play')
  })
})

describe('levelTimeOf', () => {
  it("gives the time played, else the level's own estimate, else the typical time", () => {
    expect(levelTimeOf({ minutes: 15 }, 23 * 60_000)).toBe('Played 23 min')
    expect(levelTimeOf({ minutes: 15 }, null)).toBe('About 15 min')
    expect(levelTimeOf({ minutes: null }, null)).toBe(TYPICAL_LEVEL_TIME)
  })
})

describe('planNoteOf', () => {
  it('explains a stop not built yet or locked, and says nothing about a playable one', () => {
    expect(planNoteOf({ levelId: null, side: true, state: 'locked' })).toBe(PLAN_NOTES.side)
    expect(planNoteOf({ levelId: null, side: false, state: 'locked' })).toBe(PLAN_NOTES.main)
    expect(planNoteOf({ levelId: 'x', side: false, state: 'locked' })).toBe(PLAN_NOTES.locked)
    expect(planNoteOf({ levelId: 'x', side: false, state: 'available' })).toBeNull()
  })
})

describe('mapDetailOf', () => {
  it('describes a locked level: where it is, the skills it needs and no way in yet', () => {
    const detail = detailFor(emptyProgress(), RUN_ANYTHING)
    expect(detail).toMatchObject({
      place: 'Act I · Process District · 1.4',
      title: 'Run Anything',
      play: null,
      time: TYPICAL_LEVEL_TIME,
      bestTaint: 'Not finished yet',
      note: PLAN_NOTES.locked,
    })
    expect(detail.needs.length).toBeGreaterThan(0)
    expect(detail.needs.every((need) => !need.met)).toBe(true)
    expect(detail.codex.every((card) => card.href.startsWith('#/codex/'))).toBe(true)
  })

  it('offers a replay of a finished level with its best Taint and the skills it taught', () => {
    const first = realContent().game.levels[0]?.id ?? ''
    const detail = detailFor(doneWithHelp(first), first)
    expect(detail.play?.label).toBe('Replay')
    expect(detail.bestTaint).toBe('0, clean')
    expect(detail.skills.length).toBeGreaterThan(0)
    expect(detail.time).toMatch(/^Played /)
  })
})
