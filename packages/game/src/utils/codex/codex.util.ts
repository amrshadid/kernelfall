import type { CodexEntry } from '#types/definitions/codex'
import type { GameContent } from '#types/definitions/content'
import type { Progress } from '#types/definitions/progress'

/**
 * The player's Codex: cards from completed levels, in the order they were
 * collected. A card shared by several levels appears once.
 */
export function collectCodex(progress: Progress, content: GameContent): readonly CodexEntry[] {
  const seen = new Set<string>()
  const entries: CodexEntry[] = []
  for (const levelId of progress.completionOrder) {
    for (const card of content.level(levelId)?.codex ?? []) {
      if (!seen.has(card.id)) {
        seen.add(card.id)
        entries.push({ card, levelId })
      }
    }
  }
  return entries
}
