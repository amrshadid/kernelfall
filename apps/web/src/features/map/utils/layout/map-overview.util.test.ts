import type { Progress } from '@kernelfall/game/types'
import { emptyProgress } from '@kernelfall/game/utils'
import { mapLayers } from '@shared/utils/map'
import { describe, expect, it } from 'vitest'
import { doneWithHelp, nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { OVERVIEW_HERE_AT } from './map-layout.constants'
import { layoutMap } from './map-layout.util'
import { overviewDescription, overviewWindow } from './map-overview.util'

const loaded = realContent()
const all = loaded.game.levels.map((level) => level.id)
const [first = ''] = all
const prologue = loaded.game.levels.filter((level) => level.act === 'prologue').map((level) => level.id)

/** Power On started and left mid-level. */
function midPrologue(): Progress {
  const started = doneWithHelp(first)
  return {
    ...started,
    levels: started.levels.map((level) => ({ ...level, completedAt: null, best: null })),
    completionOrder: [],
    lastActive: { levelId: first, phase: 'build' },
  }
}

const STATES: readonly (readonly [string, Progress])[] = [
  ['fresh', emptyProgress()],
  ['mid-Prologue', midPrologue()],
  ['in P.2', doneWithHelp(first)],
  ['in 1.4', doneWithHelp(...prologue)],
  ['all done', doneWithHelp(...all)],
]

function layersFor(progress: Progress) {
  return mapLayers(loaded, nodesFor(progress, loaded))
}

describe('overview', () => {
  it.each(STATES)('flags the Kernel Map current stop (%s)', (_, progress) => {
    const layers = layersFor(progress)
    const current = layers.flatMap((layer) => layer.regions.flatMap((region) => region.nodes)).find((n) => n.here)
    for (const width of [450, 900]) {
      const map = layoutMap(layers, width)
      const overview = layoutMap(layers, width, 'overview')
      expect(overview.here?.key).toBe(map.here?.key)
      expect(overview.here?.key).toBe(current?.key)
    }
  })

  it('stands on P.1 fresh and in the middle of Power On, on P.2 after it, on 1.4 after the Prologue, and nowhere once all is done', () => {
    const hereOf = (progress: Progress) => layoutMap(layersFor(progress), 600, 'overview').here?.key
    expect(hereOf(emptyProgress())).toBe('prologue/boot-path/P.1')
    expect(hereOf(midPrologue())).toBe('prologue/boot-path/P.1')
    expect(hereOf(doneWithHelp(first))).toBe('prologue/boot-path/P.2')
    expect(hereOf(doneWithHelp(...prologue))).toBe('act1/process-district/1.4')
    expect(hereOf(doneWithHelp(...all))).toBeUndefined()
  })

  it('windows the sheet around "you", inside the drawing, fading where more lies beyond', () => {
    const scene = layoutMap(layersFor(doneWithHelp(...prologue)), 600, 'overview')
    const shown = overviewWindow(scene, 480)
    expect(shown.height).toBe(480)
    expect((scene.here?.y ?? 0) - shown.top).toBeCloseTo(480 * OVERVIEW_HERE_AT, 0)
    expect(shown).toMatchObject({ fadeTop: true, fadeBottom: true })

    const fresh = layoutMap(layersFor(emptyProgress()), 600, 'overview')
    expect(overviewWindow(fresh, 480)).toMatchObject({ top: 0, fadeTop: false, fadeBottom: true })
    expect(overviewWindow(fresh, fresh.height + 100)).toEqual({
      top: 0,
      height: fresh.height,
      fadeTop: false,
      fadeBottom: false,
    })
  })

  it('keeps the flag and the next stop inside the window', () => {
    for (const [, progress] of STATES) {
      const scene = layoutMap(layersFor(progress), 450, 'overview')
      if (!scene.here) {
        continue
      }
      const shown = overviewWindow(scene, 420)
      const at = scene.stops.findIndex((stop) => stop.key === scene.here?.key)
      const next = scene.stops.slice(at + 1).find((stop) => stop.spurFrom === null)
      for (const y of [scene.here.y - 52, scene.here.y, next?.y ?? scene.here.y]) {
        expect(y).toBeGreaterThanOrEqual(shown.top)
        expect(y).toBeLessThanOrEqual(shown.top + shown.height)
      }
    }
  })

  it('says where the player stands and what is next', () => {
    expect(overviewDescription(layersFor(emptyProgress()))).toBe(
      'You are at P.1 Power On, in the Surface layer; next: P.2 First Words. Open the Kernel Map.'
    )
    expect(overviewDescription(layersFor(doneWithHelp(...prologue)))).toMatch(
      /^You are at 1\.4 Run Anything, in the Userland layer; next: 1\.5 /
    )
    expect(overviewDescription(layersFor(doneWithHelp(...all)))).toContain('Every level built so far is rebuilt.')
  })
})
