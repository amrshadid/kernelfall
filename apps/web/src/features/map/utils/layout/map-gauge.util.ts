import type { GaugeLayer, GaugeSegment, LayerSpan } from '@features/map/types'
import type { LayerId, MapLayer } from '@shared/types'
import { GAUGE_SETTLE_PASSES, MIN_GAUGE_SHARE, MIN_VIEW_SHARE } from './map-gauge.constants'

/** The part of the drawing in view, as fractions of the gauge's height. */
export interface GaugeWindow {
  readonly start: number
  readonly size: number
}

export function gaugeLayersOf(layers: readonly MapLayer[], segments: readonly GaugeSegment[]): readonly GaugeLayer[] {
  return layers.map((layer, index) => ({
    id: layer.id,
    short: layer.short,
    count: layer.total === 0 ? '' : `${layer.done}/${layer.total}`,
    tone: layer.tone,
    start: segments[index]?.start ?? 0,
    size: segments[index]?.size ?? 0,
  }))
}

/** The depth gauge: each layer's share of the drawing's height, but never less than `minShare`. */
export function gaugeSegments(layers: readonly LayerSpan[], minShare = MIN_GAUGE_SHARE): readonly GaugeSegment[] {
  const heights = layers.map((layer) => Math.max(0, layer.bottom - layer.top))
  const total = heights.reduce((sum, height) => sum + height, 0) || 1
  let shares = heights.map((height) => height / total)
  // Raise the small ones to the minimum and shrink the rest to fit.
  for (let pass = 0; pass < GAUGE_SETTLE_PASSES; pass += 1) {
    const small = shares.map((share) => share <= minShare)
    const fixed = small.filter(Boolean).length * minShare
    const rest = shares.reduce((sum, share, index) => (small[index] ? sum : sum + share), 0) || 1
    shares = shares.map((share, index) => (small[index] ? minShare : (share / rest) * (1 - fixed)))
  }
  let start = 0
  return layers.map((layer, index) => {
    const size = shares[index] ?? 0
    const segment = { id: layer.id, start, size }
    start += size
    return segment
  })
}

/** Where drawing height `y` falls on the gauge, as a fraction from its top. */
export function gaugeAt(y: number, layers: readonly LayerSpan[], segments: readonly GaugeSegment[]): number {
  const index = layers.findIndex((layer) => y < layer.bottom)
  const at = index === -1 ? layers.length - 1 : index
  const layer = layers[at]
  const segment = segments[at]
  if (!layer || !segment) {
    return 0
  }
  const within = Math.min(1, Math.max(0, (y - layer.top) / Math.max(1, layer.bottom - layer.top)))
  return Math.min(1, Math.max(0, segment.start + segment.size * within))
}

/** The part of the drawing in view, on the gauge; at least `minSize`, so it stays visible on a tall drawing. */
export function gaugeWindow(
  top: number,
  view: number,
  layers: readonly LayerSpan[],
  segments: readonly GaugeSegment[],
  minSize = MIN_VIEW_SHARE
): GaugeWindow {
  const height = layers[layers.length - 1]?.bottom ?? 0
  const start = gaugeAt(top, layers, segments)
  const size = Math.max(minSize, gaugeAt(Math.min(height, top + view), layers, segments) - start)
  return { start: Math.min(start, 1 - size), size }
}

export function layerAt(y: number, layers: readonly LayerSpan[]): LayerId | null {
  return layers.find((layer) => y >= layer.top && y < layer.bottom)?.id ?? layers[layers.length - 1]?.id ?? null
}
