import type { CheckVerdict } from '#types/definitions/checker'

/**
 * The verdict of a play-through so far: an objective met by any run stays met,
 * since a level's behaviors can be shown one command at a time (a normal session
 * of the shell, then one under `prlimit`). Taint is the latest run's, so fixing
 * the code clears it.
 */
export function mergeVerdicts(previous: CheckVerdict | null, latest: CheckVerdict): CheckVerdict {
  if (previous === null) {
    return latest
  }
  const stillMissing = new Set(previous.missing.map((objective) => objective.id))
  const missing = latest.missing.filter((objective) => stillMissing.has(objective.id))
  return { passed: missing.length === 0, missing, taint: latest.taint }
}
