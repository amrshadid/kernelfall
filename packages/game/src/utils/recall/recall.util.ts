import type { CodexEntry } from '#types/definitions/codex'
import type { GameContent } from '#types/definitions/content'
import type { LevelId } from '#types/definitions/level'
import type { RegionOutline } from '#types/definitions/outline'
import type { EpochMs, Progress } from '#types/definitions/progress'
import type { RecallDeck, RecallMark } from '#types/definitions/recall'
import { RECALL_LEVEL_CARDS, RECALL_REGION_CARDS } from '#types/definitions/recall'

/** The region this level is the last of, if every level of that region is built. */
function closedRegion(content: GameContent, levelId: LevelId): RegionOutline | null {
  for (const act of content.acts) {
    for (const region of act.regions) {
      if (region.slots.at(-1)?.levelId === levelId) {
        return region.slots.every((slot) => slot.levelId !== null) ? region : null
      }
    }
  }
  return null
}

function cardsOf(content: GameContent, levelIds: readonly LevelId[]): CodexEntry[] {
  const seen = new Set<string>()
  const entries: CodexEntry[] = []
  for (const levelId of levelIds) {
    for (const card of content.level(levelId)?.codex ?? []) {
      if (!seen.has(card.id)) {
        seen.add(card.id)
        entries.push({ card, levelId })
      }
    }
  }
  return entries
}

/** Missed last time, then never asked, then known. */
function rank(mark: RecallMark | undefined): number {
  if (!mark) return 1
  return mark.knew ? 2 : 0
}

/**
 * What to ask when a level ends. An ordinary level asks cards from the levels
 * completed before it, never its own: those were read a minute ago. The last
 * level of a region asks over the whole region.
 */
export function recallDeck(progress: Progress, content: GameContent, levelId: LevelId): RecallDeck {
  const region = closedRegion(content, levelId)
  const marks = new Map((progress.recall ?? []).map((mark) => [mark.cardId, mark]))
  const pool = region
    ? cardsOf(
        content,
        region.slots.flatMap((slot) => slot.levelId ?? [])
      )
    : cardsOf(
        content,
        progress.completionOrder.filter((id) => id !== levelId)
      ).filter((entry) => !content.level(levelId)?.codex.some((card) => card.id === entry.card.id))
  // Array.sort is stable, so equal cards stay in the order they were met.
  const cards = [...pool].sort((a, b) => {
    const [markA, markB] = [marks.get(a.card.id), marks.get(b.card.id)]
    return rank(markA) - rank(markB) || (markA?.at ?? 0) - (markB?.at ?? 0)
  })
  return {
    region: region ? { name: region.name, levels: region.slots.length } : null,
    cards: cards.slice(0, region ? RECALL_REGION_CARDS : RECALL_LEVEL_CARDS),
  }
}

/** Records the player's own call on a card. */
export function markRecall(progress: Progress, cardId: string, knew: boolean, now: EpochMs): Progress {
  const marks = progress.recall ?? []
  const asked = (marks.find((mark) => mark.cardId === cardId)?.asked ?? 0) + 1
  return {
    ...progress,
    recall: [...marks.filter((mark) => mark.cardId !== cardId), { cardId, knew, asked, at: now }],
  }
}
