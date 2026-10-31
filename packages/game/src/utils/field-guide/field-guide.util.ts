import type { GameContent } from '#types/definitions/content'
import type { FieldGuideView } from '#types/definitions/field-guide'
import type { Progress } from '#types/definitions/progress'
import { findLevelProgress } from '#utils/progress/index'

const CLOSED: FieldGuideView = { open: false, entries: [] }

/**
 * The Field Guide as the player has it: open once the level that opens it
 * started, with the entries of every level started so far (placed ones too).
 * A slot whose level isn't built yet shows nothing.
 */
export function fieldGuideView(content: GameContent, progress: Progress): FieldGuideView {
  const guide = content.fieldGuide
  if (!guide) {
    return CLOSED
  }
  const levelOf = new Map(
    content.acts.flatMap((act) =>
      act.regions.flatMap((region) => region.slots.map((slot) => [slot.number, slot.levelId]))
    )
  )
  const reached = (slot: string) => {
    const levelId = levelOf.get(slot)
    return levelId != null && findLevelProgress(progress, levelId) !== undefined
  }
  if (!reached(guide.opensAt)) {
    return CLOSED
  }
  return { open: true, entries: guide.entries.filter((entry) => reached(entry.firstMet)) }
}
