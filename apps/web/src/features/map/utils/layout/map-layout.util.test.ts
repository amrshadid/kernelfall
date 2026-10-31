import type { MapScene, MapVariant, SceneText, TextStyle } from '@features/map/types'
import { emptyProgress } from '@kernelfall/game/utils'
import { mapLayers } from '@shared/utils/map'
import { describe, expect, it } from 'vitest'
import { doneWithHelp, nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { EDGE } from './map-layout.constants'
import { layoutMap } from './map-layout.util'
import { GLYPH } from './map-text.constants'

/** The drawing's widths at 1024 (with and without a scrollbar), 1280, 1440 and 1920 px windows, and narrower. */
const WIDTHS = [470, 518, 533, 774, 894, 1374]
/** Fig. 1's widths on the title page at 1024 to 1920 px windows. */
const OVERVIEW_WIDTHS = [420, 450, 520, 680, 900, 1350]

function sceneAt(width: number, progress = emptyProgress(), variant: MapVariant = 'map'): MapScene {
  const loaded = realContent()
  return layoutMap(mapLayers(loaded, nodesFor(progress, loaded)), width, variant)
}

const CASES: readonly (readonly [MapVariant, number])[] = [
  ...WIDTHS.map((width) => ['map', width] as const),
  ...OVERVIEW_WIDTHS.map((width) => ['overview', width] as const),
]

const SIZE: Readonly<Record<TextStyle, readonly [number, number]>> = {
  kicker: [12, GLYPH.kicker],
  zone: [26, GLYPH.zone],
  'gate-zone': [20, GLYPH.zone * (20 / 26)],
  caption: [14, GLYPH.caption],
  mono: [12, GLYPH.mono],
  meta: [12, GLYPH.meta],
  region: [16, GLYPH.region],
  num: [13, 7.4],
  label: [13, GLYPH.label],
  hw: [13, GLYPH.label],
  'tone-rebuilt': [13, GLYPH.meta],
  'tone-progress': [13, GLYPH.meta],
  'tone-dark': [13, GLYPH.meta],
}

interface Box {
  readonly what: string
  readonly left: number
  readonly right: number
  readonly top: number
  readonly bottom: number
}

function boxOf(item: SceneText): Box {
  const [size, glyph] = SIZE[item.style]
  const width = item.text.length * glyph
  const left = item.anchor === 'start' ? item.x : item.anchor === 'end' ? item.x - width : item.x - width / 2
  return { what: item.text, left, right: left + width, top: item.y - size * 0.8, bottom: item.y + size * 0.22 }
}

function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

function boxesOf(scene: MapScene): Box[] {
  const texts = [
    ...scene.layers.flatMap((layer) => [...layer.texts, ...layer.regions.flatMap((region) => region.texts)]),
    ...scene.stops.flatMap((stop) => stop.texts),
  ].map(boxOf)
  const marks = scene.stops.map((stop) => ({
    what: `mark ${stop.node.number}`,
    left: stop.x - 21,
    right: stop.x + 21,
    top: stop.y - 21,
    bottom: stop.y + 21,
  }))
  const flag = scene.here
    ? [
        {
          what: 'flag',
          left: scene.here.x - 48,
          right: scene.here.x + 48,
          top: scene.here.y - 52,
          bottom: scene.here.y - 22,
        },
      ]
    : []
  return [...texts, ...marks, ...flag]
}

describe('layoutMap', () => {
  it.each(CASES)('never overlaps two labels, marks or the flag (%s at %i px)', (variant, width) => {
    for (const progress of [emptyProgress(), doneWithHelp(realContent().game.levels[0]?.id ?? '')]) {
      const boxes = boxesOf(sceneAt(width, progress, variant))
      const clashes: string[] = []
      boxes.forEach((a, i) => {
        for (const b of boxes.slice(i + 1)) {
          if (overlaps(a, b)) {
            clashes.push(`${a.what} × ${b.what}`)
          }
        }
      })
      expect(clashes).toEqual([])
    }
  })

  it.each(CASES)('keeps every word inside the sheet and clear of the connectors (%s at %i px)', (variant, width) => {
    const scene = sceneAt(width, emptyProgress(), variant)
    for (const box of boxesOf(scene)) {
      expect(box.left, box.what).toBeGreaterThan(EDGE + 4)
      expect(box.right, box.what).toBeLessThan(width - EDGE - 4)
    }
  })

  it.each(OVERVIEW_WIDTHS)("draws the overview with the map's own stops, road and flag at %i px", (width) => {
    const progress = doneWithHelp(realContent().game.levels[0]?.id ?? '')
    const map = sceneAt(width, progress)
    const overview = sceneAt(width, progress, 'overview')
    const marks = (scene: MapScene) =>
      scene.stops.map((stop) => [stop.key, stop.x, stop.node.state, stop.node.here, stop.texts.map((t) => t.text)])
    expect(marks(overview)).toEqual(marks(map))
    expect(overview.here?.key).toBe(map.here?.key)
    expect(overview.gate?.open).toBe(map.gate?.open)
    expect(overview.layers.map((layer) => layer.id)).toEqual(map.layers.map((layer) => layer.id))
    // Only the headers' long words go, so the overview is the shorter sheet.
    expect(overview.height).toBeLessThan(map.height)
  })

  it('stacks the layers from the Surface down to the hardware without gaps', () => {
    const scene = sceneAt(860)
    expect(scene.layers.map((layer) => layer.id)).toEqual(['surface', 'userland', 'gate', 'deep', 'core', 'bedrock'])
    scene.layers.forEach((layer, index) => {
      expect(layer.bottom).toBeGreaterThan(layer.top)
      if (index > 0) {
        expect(layer.top).toBe(scene.layers[index - 1]?.bottom)
      }
    })
    expect(scene.height).toBeGreaterThanOrEqual(scene.layers[scene.layers.length - 1]?.bottom ?? 0)
  })

  it('walks every stop in play order, each layer below the last', () => {
    const scene = sceneAt(860)
    const numbers = scene.stops.map((stop) => stop.node.number)
    expect(numbers.slice(0, 3)).toEqual(['P.1', 'P.2', 'P.3'])
    expect(numbers[numbers.length - 1]).toBe('3.22')
    expect(numbers).toHaveLength(nodesFor(emptyProgress()).length)
    const ys = scene.stops.filter((stop) => stop.spurFrom === null).map((stop) => stop.y)
    expect(ys.every((y, index) => index === 0 || y >= (ys[index - 1] ?? 0))).toBe(true)
  })

  it('switches back at each row: the next row runs the other way', () => {
    const scene = sceneAt(860)
    const p = (n: string) => scene.stops.find((stop) => stop.node.number === n)
    // P.1–P.4 run left to right; the Machine in Section's row runs back.
    expect((p('P.2')?.x ?? 0) > (p('P.1')?.x ?? 0)).toBe(true)
    expect((p('P.6')?.x ?? 0) < (p('P.5')?.x ?? 0)).toBe(true)
  })

  it('splits a region into balanced rows when it is too long for the width', () => {
    const narrow = sceneAt(470)
    const rowYs = new Set(narrow.stops.filter((stop) => stop.node.regionId === 'machine-in-section').map((s) => s.y))
    expect(rowYs.size).toBe(2)
  })

  it('draws the road solid up to the farthest stop in reach and dashed after it', () => {
    const fresh = sceneAt(860)
    const p1 = fresh.stops.find((stop) => stop.node.number === 'P.1')
    expect(fresh.road.reached.endsWith(`L${p1?.x} ${p1?.y}`)).toBe(true)
    expect(fresh.road.ahead.startsWith(`M${p1?.x} ${p1?.y}`)).toBe(true)

    const later = sceneAt(860, doneWithHelp(realContent().game.levels[0]?.id ?? ''))
    const p2 = later.stops.find((stop) => stop.node.number === 'P.2')
    expect(later.road.reached.endsWith(`L${p2?.x} ${p2?.y}`)).toBe(true)
    expect(later.here).toMatchObject({ x: p2?.x, y: p2?.y })
  })

  it('puts the Gate in the middle of the A–A line, shut until 1.B is passed', () => {
    const scene = sceneAt(860)
    const gate = scene.stops.find((stop) => stop.node.number === '1.B')
    expect(gate?.x).toBe(430)
    expect(scene.gate).toMatchObject({ x: 430, y: gate?.y, open: false })
    expect(scene.road.ahead).toContain(`L430 ${gate?.y}`)
  })

  it('hangs side levels off the road on spurs', () => {
    const scene = sceneAt(860)
    const side = scene.stops.find((stop) => stop.node.number === '3.10')
    expect(side?.spurFrom).not.toBeNull()
    expect(side?.y).toBeGreaterThan(side?.spurFrom?.y ?? 0)
    expect(scene.spurs.map((spur) => spur.key)).toContain(side?.key)
    expect(scene.road.ahead).not.toContain(`${side?.x} ${side?.y}`)
  })
})
