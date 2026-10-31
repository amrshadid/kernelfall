import type { Act, LevelId } from '#types/definitions/level'
import type { PlacementCheck } from '#types/definitions/placement'

/**
 * One layer of the Machine as the Kernel Map draws it in section, top to bottom:
 * going down is going deeper into the kernel.
 */
export interface MapLayerText {
  /** Unique across the map, e.g. `userland`; a region drawn in another act's layer names it. */
  readonly key: string
  readonly name: string
  /** Short name for the depth gauge. */
  readonly short: string
  /** "Ring 3 · user mode · Survey and Act I". */
  readonly kicker: string
  /** One sentence: what lives here. */
  readonly caption: string
  /** The longer "what lives here" note. */
  readonly note: string
  /** Kernel source folders, as in the v6.18 tree. */
  readonly source: string
  readonly guides: string
}

/** A place in a region for a level, built or still only planned. */
export interface SlotOutline {
  /** As printed on the map, a string so YAML keeps it as written: `P.2`, `1.4`, `1.10`, `1.B`. */
  readonly number: string
  readonly title: string
  /** The level's id, or `null` while the level is planned in docs/levels/ but not built. */
  readonly levelId: LevelId | null
  /** A side level: no later prerequisite chain passes through it. */
  readonly optional: boolean
  /** What the level is about, for the Kernel Map while it is planned; a built level's own wins. */
  readonly summary?: string
  /** About how long the level takes, while it is planned; a built level's own wins. */
  readonly minutes?: number
}

/** A region of an act: its Codex chapter and its stretch of the Kernel Map. */
export interface RegionOutline {
  /** Unique within its act (`mainline` is in Act II and Act III). */
  readonly id: string
  readonly name: string
  readonly boss: boolean
  /** What the region teaches, in a few words. */
  readonly caption: string
  /** Where it lives in the kernel source. */
  readonly source: string
  /** Who guides the player there. */
  readonly guide: string
  /** The key of the map layer it is drawn in: its act's, another act's, or its own. */
  readonly layer: string
  readonly slots: readonly SlotOutline[]
  /** From its `placement.yaml`: how a player who knows the region may skip its levels; left out, none may. */
  readonly placement?: PlacementCheck
}

/** An act, its map layer and its regions, in play order. */
export interface ActOutline {
  readonly act: Act
  readonly name: string
  readonly layer: MapLayerText
  readonly regions: readonly RegionOutline[]
}

/** What an act's `act.yaml` holds. */
export interface ActFile {
  readonly id: Act
  readonly name: string
  readonly layer: MapLayerText
}

/** A slot as `region.yaml` lists it: a level by its folder's name, not by id. */
export interface SlotFile {
  readonly number: string
  readonly title: string
  /** The level's folder in the region, e.g. `02-first-words`. */
  readonly level?: string
  readonly optional: boolean
  readonly summary?: string
  readonly minutes?: number
}

/** What a region's `region.yaml` holds. */
export interface RegionFile {
  readonly id: string
  readonly name: string
  readonly boss: boolean
  readonly caption: string
  readonly source: string
  readonly guide: string
  /** A layer of the region's own (the Syscall Gate). */
  readonly layer?: MapLayerText
  /** Draw the region in another act's layer, by key (the Surface Survey sits in Userland). */
  readonly inLayer?: string
  readonly slots: readonly SlotFile[]
}
