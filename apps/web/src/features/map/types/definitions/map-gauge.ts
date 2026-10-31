import type { LayerId, Tone } from '@shared/types'

export interface GaugeLayer {
  readonly id: LayerId
  readonly short: string
  /** "1/16"; empty for a layer without levels. */
  readonly count: string
  readonly tone: Tone
  /** Fractions of the gauge's height. */
  readonly start: number
  readonly size: number
}

/** The map scroller's offset and height, in px. */
export interface ScrollFrame {
  readonly top: number
  readonly view: number
}

/** A layer's place in the drawing, top to bottom, in px. */
export interface LayerSpan {
  readonly id: LayerId
  readonly top: number
  readonly bottom: number
}

/** One layer's share of the depth gauge, as fractions of its height. */
export interface GaugeSegment {
  readonly id: LayerId
  readonly start: number
  readonly size: number
}
