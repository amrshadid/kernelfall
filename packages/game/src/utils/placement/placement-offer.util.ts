import type { LevelId } from '#types/definitions/level'
import type { ActOutline } from '#types/definitions/outline'
import type { PlacementOffer } from '#types/definitions/placement'
import type { Progress } from '#types/definitions/progress'

const started = (progress: Progress, levelId: LevelId): boolean =>
  progress.levels.some((level) => level.levelId === levelId)

/**
 * The region's check, offered on the first of its skippable levels while the player has started
 * none of them: at the region's edge, before its first level is played.
 */
export function placementOfferAt(
  acts: readonly ActOutline[],
  levelId: LevelId,
  progress: Progress
): PlacementOffer | null {
  for (const act of acts) {
    for (const region of act.regions) {
      const check = region.placement
      const [first] = check?.tasks ?? []
      if (check && first?.levelId === levelId) {
        return check.tasks.some((task) => started(progress, task.levelId))
          ? null
          : { act: act.act, regionId: region.id, regionName: region.name, check }
      }
    }
  }
  return null
}
