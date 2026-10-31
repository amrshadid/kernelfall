import type { LayerId } from '@shared/types'

/** What the pointer or the keyboard is on. */
export type MapNoteTarget =
  | { readonly kind: 'stop'; readonly key: string }
  | { readonly kind: 'region'; readonly key: string }
  | { readonly kind: 'layer'; readonly id: LayerId }

/** The note under the drawing: what the thing under the pointer or focus is. */
export interface MapNote {
  /** "P.4 · The Boot Path", "Process District", "What lives here · Userland". */
  readonly title: string
  readonly text: string
  /** "Next up", "About 20 min", "Boss", "Guide: init". */
  readonly facts: readonly string[]
}

/** Every note the map can show, by stop key, region key and layer. */
export interface MapNotes {
  readonly stops: ReadonlyMap<string, MapNote>
  readonly regions: ReadonlyMap<string, MapNote>
  readonly layers: ReadonlyMap<LayerId, MapNote>
}
