import type { Act, LevelId } from '@kernelfall/game/types'
import type { LAYER_IDS } from '@shared/utils/map/map-layers.constants'
import type { NodeState } from './ui'

export type LayerId = (typeof LAYER_IDS)[number]

/** How lit a layer or region is: every slot done, some started, or nothing yet. */
export type Tone = 'rebuilt' | 'progress' | 'dark'

/** One stop on the Kernel Map's path. */
export interface MapNode {
  /** Unique across the map: `act2/mainline/2.13` (region ids repeat across acts). */
  readonly key: string
  readonly number: string
  readonly title: string
  readonly levelId: LevelId | null
  readonly act: Act
  readonly regionId: string
  /** `act2/mainline`: the region, unique across acts. */
  readonly regionKey: string
  readonly state: NodeState
  /** Spoken and printed status, e.g. "in progress, you are here". */
  readonly status: string
  readonly playable: boolean
  /** Planned in docs/levels/ but not built yet: drawn in pencil. */
  readonly planned: boolean
  /** A side level: it branches off the main path. */
  readonly side: boolean
  /** The stop is a boss (its region is a boss region). */
  readonly boss: boolean
  readonly here: boolean
  /** What the player does and learns there, in plain words; the region's text while no summary is written. */
  readonly summary: string
  /** About how long it takes a new player, when its level or slot says. */
  readonly minutes: number | null
}

/** What a layer of the Machine is, in plain words. */
export interface LayerInfo {
  readonly id: LayerId
  readonly name: string
  /** Short name for the depth gauge. */
  readonly short: string
  /** "Ring 3 · user mode · Survey and Act I". */
  readonly kicker: string
  /** One sentence: what lives here. */
  readonly caption: string
  /** The longer "what lives here" note, shown on hover or focus. */
  readonly note: string
  /** Kernel source folders, as in the v6.18 tree. */
  readonly source: string
  readonly guides: string
}

/** What a region teaches, where it lives in the kernel source, and who guides you there. */
export interface RegionInfo {
  readonly caption: string
  readonly source: string
  readonly guide: string
}

/** One region of a layer, with its stops. */
export interface MapRegion {
  readonly key: string
  readonly name: string
  readonly boss: boolean
  readonly info: RegionInfo | null
  readonly nodes: readonly MapNode[]
  readonly tone: Tone
  /** "rebuilt · 3 of 3", "in progress · 0 of 5", "dark · 0 of 2". */
  readonly progress: string
}

/** One layer of the Machine, with its regions in play order. */
export interface MapLayer extends LayerInfo {
  readonly regions: readonly MapRegion[]
  readonly done: number
  readonly total: number
  readonly tone: Tone
  /** "3 of 7 rebuilt"; empty for Bedrock, which has no levels. */
  readonly progress: string
  /** One sentence for screen readers. */
  readonly summary: string
  readonly hasHere: boolean
}
