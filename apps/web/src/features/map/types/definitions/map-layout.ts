import type { LayerId, MapNode, Tone } from '@shared/types'

/** `overview` is Fig. 1 on the title page: the same drawing, headers cut to name and progress. */
export type MapVariant = 'map' | 'overview'

/** The part of the drawing an overview shows, in drawing px. */
export interface OverviewWindow {
  readonly top: number
  readonly height: number
  /** More drawing lies above or below the window: that edge fades out. */
  readonly fadeTop: boolean
  readonly fadeBottom: boolean
}

/** A text style of the drawing; the component maps it to a class. */
export type TextStyle =
  | 'kicker'
  | 'zone'
  | 'gate-zone'
  | 'caption'
  | 'mono'
  | 'meta'
  | 'region'
  | 'num'
  | 'label'
  | 'hw'
  | 'tone-rebuilt'
  | 'tone-progress'
  | 'tone-dark'

export interface SceneText {
  readonly x: number
  readonly y: number
  readonly text: string
  readonly style: TextStyle
  readonly anchor: 'start' | 'middle' | 'end'
  /** Pencil grey: locked or not built yet. */
  readonly dim: boolean
}

export interface ScenePoint {
  readonly x: number
  readonly y: number
}

export interface SceneRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface SceneStop {
  readonly key: string
  readonly node: MapNode
  readonly layerId: LayerId
  readonly x: number
  readonly y: number
  readonly texts: readonly SceneText[]
  /** A side level hangs off the path on a spur from this point. */
  readonly spurFrom: ScenePoint | null
}

export interface SceneRegion {
  readonly key: string
  readonly texts: readonly SceneText[]
  /** The band from the region's name to its last row, in drawing px. */
  readonly top: number
  readonly bottom: number
}

export interface SceneLayer {
  readonly id: LayerId
  readonly top: number
  readonly bottom: number
  readonly tone: Tone
  /** The sheet the header is printed on, over the hatching; null for the Gate. */
  readonly panel: SceneRect | null
  readonly texts: readonly SceneText[]
  readonly regions: readonly SceneRegion[]
  /** The group's accessible name; its printed words follow as the summary. */
  readonly name: string
  readonly summary: string
}

export interface SceneGate {
  readonly x: number
  readonly y: number
  readonly open: boolean
  /** The A–A section line runs between these x, broken around the gate. */
  readonly left: number
  readonly right: number
}

export interface SceneHardware {
  readonly boxes: readonly (SceneRect & { readonly lines: readonly string[] })[]
  readonly busY: number
  readonly busLeft: number
  readonly busRight: number
}

export interface MapScene {
  readonly variant: MapVariant
  readonly width: number
  readonly height: number
  readonly layers: readonly SceneLayer[]
  /** In travel order: the order arrow keys walk. */
  readonly stops: readonly SceneStop[]
  /** SVG path data: the road up to the farthest stop in reach, and the road ahead. */
  readonly road: { readonly reached: string; readonly ahead: string }
  readonly spurs: readonly { readonly key: string; readonly d: string; readonly reached: boolean }[]
  readonly start: ScenePoint | null
  readonly gate: SceneGate | null
  readonly hardware: SceneHardware | null
  readonly here: (ScenePoint & { readonly key: string }) | null
}
