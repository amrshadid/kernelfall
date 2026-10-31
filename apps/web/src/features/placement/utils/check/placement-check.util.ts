import type { PlacementRow, PlacementSummary } from '@features/placement/types'
import type { LevelId, PlacementCheck, PlacementProgress, PlacementResult } from '@kernelfall/game/types'

/** Each task with how far the player got: an objective met by any command stays met. */
export function placementRows(
  check: PlacementCheck,
  progress: PlacementProgress,
  nameOf: (levelId: LevelId) => string
): readonly PlacementRow[] {
  return check.tasks.map((task) => {
    const met = task.objectives.filter((id) => progress.get(task.levelId)?.has(id) === true).length
    return {
      levelId: task.levelId,
      level: nameOf(task.levelId),
      task: task.task,
      files: task.files,
      met,
      of: task.objectives.length,
      passed: met === task.objectives.length,
    }
  })
}

export function placementSummary(result: PlacementResult, nameOf: (levelId: LevelId) => string): PlacementSummary {
  return { placed: result.placed.map(nameOf), sendTo: result.sendTo === null ? null : nameOf(result.sendTo) }
}
