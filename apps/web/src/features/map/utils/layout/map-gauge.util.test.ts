import type { LayerSpan } from '@features/map/types'
import { emptyProgress } from '@kernelfall/game/utils'
import { mapLayers } from '@shared/utils/map'
import { describe, expect, it } from 'vitest'
import { nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { gaugeAt, gaugeLayersOf, gaugeSegments, gaugeWindow, layerAt } from './map-gauge.util'

const layers: readonly LayerSpan[] = [
  { id: 'surface', top: 0, bottom: 500 },
  { id: 'gate', top: 500, bottom: 520 },
  { id: 'deep', top: 520, bottom: 1000 },
]

describe('gaugeSegments', () => {
  it('gives each layer its share of the depth, never less than the minimum', () => {
    const segments = gaugeSegments(layers, 0.1)
    expect(segments.reduce((sum, segment) => sum + segment.size, 0)).toBeCloseTo(1)
    expect(segments[1]?.size).toBeCloseTo(0.1)
    expect(segments[0]?.start).toBe(0)
    expect(segments[2]?.start).toBeCloseTo((segments[0]?.size ?? 0) + (segments[1]?.size ?? 0))
  })
})

describe('gaugeAt', () => {
  it('maps drawing heights onto the gauge in order', () => {
    const segments = gaugeSegments(layers, 0.1)
    const marks = [0, 250, 510, 760, 1000].map((y) => gaugeAt(y, layers, segments))
    expect(marks[0]).toBe(0)
    expect(marks[4]).toBe(1)
    expect(marks.every((mark, index) => index === 0 || mark > (marks[index - 1] ?? 0))).toBe(true)
  })
})

describe('gaugeWindow', () => {
  const segments = gaugeSegments(layers, 0.1)

  it('maps the scrolled view onto the gauge, moving down as the drawing scrolls', () => {
    const atTop = gaugeWindow(0, 200, layers, segments)
    expect(atTop.start).toBe(0)
    expect(atTop.size).toBeCloseTo(gaugeAt(200, layers, segments))

    const lower = gaugeWindow(600, 200, layers, segments)
    expect(lower.start).toBeCloseTo(gaugeAt(600, layers, segments))
    expect(lower.start + lower.size).toBeCloseTo(gaugeAt(800, layers, segments))
  })

  it('agrees with the "You" marker: a view starting at a height starts at its mark', () => {
    const here = gaugeAt(510, layers, segments)
    expect(gaugeWindow(510, 100, layers, segments).start).toBeCloseTo(here)
  })

  it('never shrinks below the minimum and never runs past the foot', () => {
    expect(gaugeWindow(100, 0, layers, segments, 0.05).size).toBe(0.05)
    const bottom = gaugeWindow(1000, 0, layers, segments, 0.05)
    expect(bottom.start + bottom.size).toBeCloseTo(1)
    const pastFoot = gaugeWindow(900, 400, layers, segments)
    expect(pastFoot.start + pastFoot.size).toBeCloseTo(1)
  })
})

describe('gaugeLayersOf', () => {
  it('places each layer on its segment and counts its levels', () => {
    const mapped = mapLayers(realContent(), nodesFor(emptyProgress()))
    const segments = gaugeSegments(mapped.map((layer, index) => ({ id: layer.id, top: index, bottom: index + 1 })))
    const marks = gaugeLayersOf(mapped, segments)
    expect(marks.map((mark) => mark.id)).toEqual(mapped.map((layer) => layer.id))
    expect(marks[1]?.start).toBeCloseTo(segments[1]?.start ?? -1)
    const empty = mapped.findIndex((layer) => layer.total === 0)
    expect(marks[empty]?.count).toBe('')
    const withLevels = mapped.findIndex((layer) => layer.total > 0)
    expect(marks[withLevels]?.count).toBe(`0/${mapped[withLevels]?.total}`)
  })
})

describe('layerAt', () => {
  it('finds the layer at a height', () => {
    expect(layerAt(10, layers)).toBe('surface')
    expect(layerAt(510, layers)).toBe('gate')
    expect(layerAt(5000, layers)).toBe('deep')
  })
})
