import type { CodexEntry } from '#types/definitions/codex'

/** Cards asked after an ordinary level, and at the end of a region. */
export const RECALL_LEVEL_CARDS = 3
export const RECALL_REGION_CARDS = 5

/** How the player last did on one Codex card, by their own call. */
export interface RecallMark {
  readonly cardId: string
  readonly knew: boolean
  /** Times asked, over all levels. */
  readonly asked: number
  /** Milliseconds since the Unix epoch. */
  readonly at: number
}

/** The region a level closes: the recap looks back over all of it. */
export interface RecallRegion {
  readonly name: string
  readonly levels: number
}

/** The cards to ask at the end of a level: missed ones first, then new ones, then the oldest known. */
export interface RecallDeck {
  /** Null unless this level is the last of a fully built region. */
  readonly region: RecallRegion | null
  readonly cards: readonly CodexEntry[]
}
