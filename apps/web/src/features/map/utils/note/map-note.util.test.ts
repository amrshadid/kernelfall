import { TYPICAL_LEVEL_TIME } from '@features/map/utils/detail'
import { layoutMap } from '@features/map/utils/layout'
import type { KernelMap, KernelMapLevel, LevelDefinition, LevelProgress } from '@kernelfall/game/types'
import { emptyProgress } from '@kernelfall/game/utils'
import type { MapLayer, MapNode, MapRegion } from '@shared/types'
import { mapLayers } from '@shared/utils/map'
import { describe, expect, it } from 'vitest'
import { nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { NOTE_STATES } from './map-note.constants'
import {
  layerNoteOf,
  mapNotesOf,
  noteOf,
  regionNoteOf,
  sameTarget,
  stopNoteOf,
  stopStateOf,
  targetAt,
} from './map-note.util'

function node(number: string, title: string, overrides: Partial<MapNode> = {}): MapNode {
  return {
    key: `act1/district/${number}`,
    number,
    title,
    levelId: `level-${number}`,
    act: 'act1',
    regionId: 'district',
    regionKey: 'act1/district',
    state: 'locked',
    status: 'locked',
    playable: false,
    planned: false,
    side: false,
    boss: false,
    here: false,
    summary: `What ${title} is about.`,
    minutes: null,
    ...overrides,
  }
}

interface Entry {
  readonly skills?: readonly string[]
  readonly prerequisites?: readonly string[]
  readonly taint?: number
  readonly activeMs?: number
}

/** Just what the note reads from the game's map: each level's skills, needs, Taint and time. */
function mapOf(entries: Readonly<Record<string, Entry>>, unlocked: readonly string[] = []): KernelMap {
  const levels = Object.entries(entries).map(
    ([id, entry]): KernelMapLevel => ({
      level: { id, skills: entry.skills ?? [], prerequisites: entry.prerequisites ?? [] } as unknown as LevelDefinition,
      status: 'locked',
      record: entry.activeMs === undefined ? undefined : ({ activeMs: entry.activeMs } as LevelProgress),
      taint: entry.taint ?? 0,
      isPlayable: false,
    })
  )
  return { levels, byId: new Map(levels.map((level) => [level.level.id, level])), unlockedSkills: new Set(unlocked) }
}

const SHELL = node('P.3', 'Speak to the Shell', { state: 'available', status: 'available' })
const BOOT = node('P.4', 'The Boot Path')
const RUN = node('1.4', 'Run Anything')
const NODES = [SHELL, BOOT, RUN]
const MAP = mapOf({
  'level-P.3': { skills: ['shell'] },
  'level-P.4': { skills: ['boot'], prerequisites: ['shell'] },
  'level-1.4': { prerequisites: ['shell', 'boot', 'never-taught'] },
})

describe('stopStateOf', () => {
  it('says what is next, open, under way or not built', () => {
    expect(stopStateOf({ ...SHELL, here: true }, NODES, MAP)).toBe(NOTE_STATES.next)
    expect(stopStateOf(SHELL, NODES, MAP)).toBe(NOTE_STATES.available)
    expect(stopStateOf({ ...SHELL, state: 'progress' }, NODES, MAP)).toBe(NOTE_STATES.progress)
    expect(stopStateOf(node('1.7', 'The Aqueducts', { levelId: null, planned: true }), NODES, MAP)).toBe(
      NOTE_STATES.planned
    )
  })

  it('gives a finished level its Taint, and says when init finished it', () => {
    const map = mapOf({ 'level-P.3': { taint: 3 } })
    expect(stopStateOf({ ...SHELL, state: 'done' }, NODES, map)).toBe('Done, Taint 3')
    expect(stopStateOf({ ...SHELL, state: 'clean' }, NODES, mapOf({}))).toBe('Done, Taint 0')
    expect(stopStateOf({ ...SHELL, state: 'helped' }, NODES, map)).toBe("Done with init's version, Taint 3")
  })

  it('names the levels to finish first, in play order, for a locked level', () => {
    expect(stopStateOf(BOOT, NODES, MAP)).toBe('Locked: finish P.3 Speak to the Shell first')
    expect(stopStateOf(RUN, NODES, MAP)).toBe('Locked: finish P.3 Speak to the Shell and P.4 The Boot Path first')
    expect(stopStateOf(RUN, NODES, mapOf({ 'level-1.4': { prerequisites: ['never-taught'] } }))).toBe(
      NOTE_STATES.lockedUnknown
    )
  })
})

describe('stopNoteOf', () => {
  const region = { info: { caption: 'boot', source: 'init/', guide: 'init, the Watchdog' } } as MapRegion

  it('titles the stop by number and name, says what you do there, then its state, time, tag and guide', () => {
    expect(stopNoteOf({ ...BOOT, boss: true }, region, NODES, MAP)).toEqual({
      title: 'P.4 · The Boot Path',
      text: 'What The Boot Path is about.',
      facts: ['Locked: finish P.3 Speak to the Shell first', TYPICAL_LEVEL_TIME, 'Boss', 'Guide: init, the Watchdog'],
    })
    expect(stopNoteOf({ ...SHELL, side: true }, region, NODES, MAP).facts).toContain('Side level')
  })

  it('says how long the level takes when it says so, else the typical time', () => {
    expect(stopNoteOf({ ...SHELL, minutes: 15 }, region, NODES, MAP).facts[1]).toBe('About 15 min')
    expect(stopNoteOf(SHELL, region, NODES, MAP).facts[1]).toBe(TYPICAL_LEVEL_TIME)
  })

  it('gives a finished level the time it took', () => {
    const map = mapOf({ 'level-P.3': { activeMs: 12 * 60_000 } })
    expect(stopNoteOf({ ...SHELL, state: 'clean' }, region, NODES, map).facts[1]).toMatch(/^Played /)
  })
})

describe('the notes of the real map', () => {
  const content = realContent()
  const layers: readonly MapLayer[] = mapLayers(content, nodesFor(emptyProgress(), content))
  const notes = mapNotesOf(layers, mapOf({}))

  it('has a note for every stop, region and layer', () => {
    const regions = layers.flatMap((layer) => layer.regions)
    expect(notes.stops.size).toBe(regions.flatMap((region) => region.nodes).length)
    expect(notes.regions.size).toBe(regions.length)
    expect(notes.layers.size).toBe(layers.length)
  })

  it("explains a planned stop by its slot's summary", () => {
    expect(notes.stops.get('act1/process-district/1.7')).toMatchObject({
      title: '1.7 · The Aqueducts',
      text: expect.stringMatching(/^Join commands with \|/),
      facts: [NOTE_STATES.planned, TYPICAL_LEVEL_TIME, 'Guide: init'],
    })
  })

  it('explains a region: the part of Linux it stands for, its guide and progress', () => {
    const district = layers.flatMap((layer) => layer.regions).find((region) => region.key === 'act1/process-district')
    if (!district) {
      throw new Error('no Process District')
    }
    expect(regionNoteOf(district)).toEqual({
      title: 'Process District',
      text: 'The part of Linux it stands for: processes: fork, exec, wait, file descriptors, pipes, signals. In the kernel source: kernel/fork.c, fs/exec.c, fs/pipe.c, kernel/signal.c.',
      facts: ['Guide: init', `0 of ${district.nodes.length} rebuilt`],
    })
    const boss = layers.flatMap((layer) => layer.regions).find((region) => region.boss)
    expect(boss && regionNoteOf(boss).facts[0]).toBe('Boss')
  })

  it('explains a layer by its own plain words, as before', () => {
    const userland = layers.find((layer) => layer.id === 'userland')
    expect(userland && layerNoteOf(userland)).toEqual({
      title: 'What lives here · Userland',
      text: userland?.note,
      facts: [],
    })
  })

  it('falls back to the layer in view when nothing is under the pointer or focus', () => {
    expect(noteOf(null, notes, 'deep')?.title).toBe(notes.layers.get('deep')?.title)
    expect(noteOf({ kind: 'region', key: 'nowhere' }, notes, 'deep')?.title).toBe(notes.layers.get('deep')?.title)
    expect(noteOf(null, notes, null)).toBeUndefined()
    expect(noteOf({ kind: 'layer', id: 'gate' }, notes, 'deep')?.title).toBe('What lives here · The Syscall Gate')
  })
})

describe('targetAt', () => {
  const content = realContent()
  const scene = layoutMap(mapLayers(content, nodesFor(emptyProgress(), content)), 774)

  it("finds the region band at a height, and the layer above a layer's regions", () => {
    for (const layer of scene.layers) {
      expect(targetAt(scene.layers, layer.top)).toEqual(
        layer.regions[0]?.top === layer.top
          ? { kind: 'region', key: layer.regions[0].key }
          : { kind: 'layer', id: layer.id }
      )
      for (const region of layer.regions) {
        expect(targetAt(scene.layers, (region.top + region.bottom) / 2)).toEqual({ kind: 'region', key: region.key })
      }
    }
    expect(targetAt(scene.layers, -1)).toBeNull()
    expect(targetAt(scene.layers, scene.height + 1)).toBeNull()
  })

  it("puts every stop inside its own region's band, so the band under a stop is the stop's region", () => {
    const bands = scene.layers.flatMap((layer) => layer.regions)
    for (const stop of scene.stops.filter((candidate) => candidate.layerId !== 'gate')) {
      const band = bands.find((region) => region.key === stop.node.regionKey)
      expect(band && stop.y > band.top && stop.y < band.bottom, stop.key).toBe(true)
    }
  })
})

describe('sameTarget', () => {
  it('compares by kind and key or layer', () => {
    expect(sameTarget({ kind: 'stop', key: 'a' }, { kind: 'stop', key: 'a' })).toBe(true)
    expect(sameTarget({ kind: 'stop', key: 'a' }, { kind: 'region', key: 'a' })).toBe(false)
    expect(sameTarget({ kind: 'layer', id: 'gate' }, { kind: 'layer', id: 'gate' })).toBe(true)
    expect(sameTarget(null, null)).toBe(true)
    expect(sameTarget(null, { kind: 'layer', id: 'gate' })).toBe(false)
  })
})
