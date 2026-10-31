import type { Act, CodexCard, LevelId } from '#types/definitions/level'
import type { RegionOutline } from '#types/definitions/outline'

export interface CodexEntry {
  readonly card: CodexCard
  /** The level that first added the card. */
  readonly levelId: LevelId
}

/**
 * How far the player has got with a card: filed (its level completed), seen (its
 * level started) or hidden (shown only as a count, so nothing is spoiled).
 */
export type CodexCardState = 'filed' | 'seen' | 'hidden'

export interface CodexChapterCard extends CodexEntry {
  readonly state: CodexCardState
}

/** One region's cards, in play order: a chapter of the Codex. */
export interface CodexChapter {
  readonly act: Act
  readonly region: RegionOutline
  readonly cards: readonly CodexChapterCard[]
}
