import type { CheckInput } from '#types/definitions/checker'
import type { GameContent } from '#types/definitions/content'
import type { PlacementCheck, PlacementProgress, PlacementResult } from '#types/definitions/placement'

const NONE: ReadonlySet<string> = new Set()

/**
 * What one command showed: for each task, the objectives it lists that its
 * level's own checker found met. A checker that doesn't judge the command finds none.
 */
export function judgePlacement(content: GameContent, check: PlacementCheck, input: CheckInput): PlacementProgress {
  return new Map(
    check.tasks.map((task) => {
      const checker = content.checker(task.levelId)
      if (!checker || (checker.applies && !checker.applies(input))) {
        return [task.levelId, NONE]
      }
      const met = new Set(checker.check(input).objectivesMet)
      return [task.levelId, new Set(task.objectives.filter((id) => met.has(id)))]
    })
  )
}

/** The check so far: an objective met by any command stays met, as in a level. */
export function mergePlacement(previous: PlacementProgress, latest: PlacementProgress): PlacementProgress {
  const levels = new Set([...previous.keys(), ...latest.keys()])
  return new Map(
    [...levels].map((levelId) => [levelId, new Set([...(previous.get(levelId) ?? []), ...(latest.get(levelId) ?? [])])])
  )
}

/** A task passes when every objective it lists was met; the first one that didn't is where the player goes. */
export function placementResult(check: PlacementCheck, progress: PlacementProgress): PlacementResult {
  const passed = check.tasks.map((task) => ({
    levelId: task.levelId,
    passed: task.objectives.every((id) => progress.get(task.levelId)?.has(id) === true),
  }))
  return {
    placed: passed.filter((task) => task.passed).map((task) => task.levelId),
    sendTo: passed.find((task) => !task.passed)?.levelId ?? null,
  }
}
