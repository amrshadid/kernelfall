import type { LevelId } from '@kernelfall/game/types'
import type { LevelLabel, LoadedContent } from '#types/index'

/** Act levels are numbered on screen (`1.4`); the Prologue's (`P.2`) and the Survey's (`S.1`) are not. */
const NUMBERED_SLOT = /^\d/

/** How a level is named on screen: its number, title and where it sits in the outline. */
export function labelOf(content: LoadedContent, levelId: LevelId): LevelLabel | null {
  const level = content.game.level(levelId)
  const place = content.placeOf(levelId)
  if (!level || !place) {
    return null
  }
  return {
    levelId,
    number: place.slot.number,
    title: level.title,
    heading: NUMBERED_SLOT.test(place.slot.number) ? `${place.slot.number} ${level.title}` : level.title,
    regionName: place.region.name,
    actName: place.act.name,
  }
}
