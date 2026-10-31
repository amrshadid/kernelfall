import { emptyProgress } from '@kernelfall/game/utils'
import { describe, expect, it } from 'vitest'
import { doneWithHelp, nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { currentAct } from './map-nodes.util'

describe('mapNodes', () => {
  it('gives every slot of every act a stop with a key unique across acts', () => {
    const nodes = nodesFor(emptyProgress())
    expect(new Set(nodes.map((node) => node.key)).size).toBe(nodes.length)
    // Mainline is a region of Act II and of Act III.
    expect(nodes.filter((node) => node.regionId === 'mainline').map((node) => node.regionKey)).toEqual([
      'act2/mainline',
      'act3/mainline',
    ])
  })

  it('shows built levels by their status and planned ones in pencil', () => {
    const nodes = nodesFor(emptyProgress())
    const first = nodes.find((node) => node.levelId !== null)
    expect(first).toMatchObject({ number: 'P.1', state: 'available', playable: true, planned: false, here: true })
    expect(nodes.find((node) => node.number === 'P.2')).toMatchObject({ state: 'locked', planned: false })
    expect(nodes.find((node) => node.number === '1.7')).toMatchObject({
      status: 'not built yet',
      levelId: null,
      planned: true,
      playable: false,
    })
  })

  it('marks side levels and boss stops', () => {
    const nodes = nodesFor(emptyProgress())
    expect(nodes.filter((node) => node.side).map((node) => node.number)).toEqual(['3.10', '3.17', '3.19'])
    expect(nodes.filter((node) => node.boss).map((node) => node.number)).toEqual(['1.B', '2.12', '3.20'])
  })

  it("describes each stop by its slot's summary, else by its region's text", () => {
    const content = realContent()
    expect(nodesFor(emptyProgress(), content).find((node) => node.number === '1.7')?.summary).toMatch(/^Join commands/)

    const unwritten = {
      ...content,
      acts: content.acts.map((act) => ({
        ...act,
        regions: act.regions.map((region) => ({
          ...region,
          slots: region.slots.map(({ summary: _summary, ...slot }) => slot),
        })),
      })),
    }
    expect(nodesFor(emptyProgress(), unwritten).find((node) => node.number === '1.7')?.summary).toBe(
      'Part of Process District, which covers processes: fork, exec, wait, file descriptors, pipes, signals.'
    )
  })

  it("takes each stop's minutes from its level, and leaves them out where nothing says", () => {
    const nodes = nodesFor(emptyProgress())
    expect(nodes.find((node) => node.number === 'P.1')?.minutes).toBeGreaterThan(0)
    expect(nodes.find((node) => node.number === '1.7')?.minutes).toBeNull()
  })

  it('moves "you are here" to the next level after a completion', () => {
    const first = realContent().game.levels[0]?.id ?? ''
    const nodes = nodesFor(doneWithHelp(first))
    expect(nodes.find((node) => node.levelId === first)?.state).toBe('helped')
    expect(nodes.find((node) => node.number === 'P.2')).toMatchObject({
      state: 'available',
      status: 'available, you are here',
      here: true,
    })
  })
})

describe('currentAct', () => {
  it('names the act of where Continue goes, not Act I by default', () => {
    const content = realContent()
    expect(currentAct(nodesFor(emptyProgress(), content))).toBe('prologue')
    const prologue = content.game.levels.filter((level) => level.act === 'prologue').map((level) => level.id)
    expect(currentAct(nodesFor(doneWithHelp(...prologue), content))).toBe('act1')
  })
})
