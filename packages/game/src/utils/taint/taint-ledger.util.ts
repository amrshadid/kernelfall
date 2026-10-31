import type { GameTuning } from '#types/definitions/config'
import { DEFAULT_GAME_TUNING } from '#types/definitions/config'
import type { Ending, TaintEntry, TaintLedger } from '#types/definitions/taint'

/**
 * Replaces a level's Taint with the entries of its latest completion.
 *
 * Only the code the player ends up with counts, so replaying a level to clean
 * it up lowers the total, and failed attempts never add Taint.
 */
export function replaceLevelTaint(ledger: TaintLedger, levelId: string, entries: readonly TaintEntry[]): TaintLedger {
  return [...ledger.filter((entry) => entry.levelId !== levelId), ...entries]
}

/** A level's Taint, capped at `maxLevelTaint`. */
export function levelTaint(ledger: TaintLedger, levelId: string, tuning: GameTuning = DEFAULT_GAME_TUNING): number {
  const points = sumPoints(ledger.filter((entry) => entry.levelId === levelId))
  return Math.min(points, tuning.maxLevelTaint)
}

/** Total Taint (each level capped), optionally only for some levels (e.g. one act). */
export function totalTaint(
  ledger: TaintLedger,
  levelIds?: ReadonlySet<string>,
  tuning: GameTuning = DEFAULT_GAME_TUNING
): number {
  const ids = new Set(ledger.map((entry) => entry.levelId))
  let total = 0
  for (const id of ids) {
    if (!levelIds || levelIds.has(id)) {
      total += levelTaint(ledger, id, tuning)
    }
  }
  return total
}

/** Picks the ending from the total Taint at the end of Act II (docs/GAME.md §5). */
export function selectEnding(total: number, tuning: GameTuning = DEFAULT_GAME_TUNING): Ending {
  if (total <= tuning.cleanRebootMaxTaint) {
    return 'clean_reboot'
  }
  return total <= tuning.unstableRebootMaxTaint ? 'unstable_reboot' : 'dangling_survives'
}

function sumPoints(entries: readonly TaintEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.points, 0)
}
