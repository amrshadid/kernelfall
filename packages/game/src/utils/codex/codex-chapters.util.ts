import type { CodexCardState, CodexChapter, CodexChapterCard } from '#types/definitions/codex'
import type { GameContent } from '#types/definitions/content'
import type { Progress } from '#types/definitions/progress'
import { collectCodex } from '#utils/codex/codex.util'

/**
 * The whole Codex as chapters, one per region of the outline that adds cards,
 * in play order. Each card appears once, in the chapter of the first level that
 * adds it, marked filed, seen or hidden for this player: any level that adds a
 * card files it when passed and shows it when started.
 */
export function codexChapters(progress: Progress, content: GameContent): readonly CodexChapter[] {
  const filed = new Set(collectCodex(progress, content).map((entry) => entry.card.id))
  const seen = new Set(
    progress.levels.flatMap((record) => content.level(record.levelId)?.codex.map((card) => card.id) ?? [])
  )
  const placed = new Set<string>()
  const stateOf = (cardId: string): CodexCardState => {
    if (filed.has(cardId)) {
      return 'filed'
    }
    return seen.has(cardId) ? 'seen' : 'hidden'
  }

  return content.acts.flatMap((act) =>
    act.regions.flatMap((region): CodexChapter[] => {
      const cards: CodexChapterCard[] = []
      const inRegion = content.levels.filter((level) => level.act === act.act && level.region === region.id)
      for (const level of inRegion) {
        for (const card of level.codex.filter((candidate) => !placed.has(candidate.id))) {
          placed.add(card.id)
          cards.push({ card, levelId: level.id, state: stateOf(card.id) })
        }
      }
      return cards.length > 0 ? [{ act: act.act, region, cards }] : []
    })
  )
}
