import { isRecord } from '@kernelfall/core/utils'
import type { LevelId } from '#types/definitions/level'
import type { SaveMigration } from '#types/definitions/saves'

type SaveData = Readonly<Record<string, unknown>>

/** Version 1 → 2: the Prologue's built level became P.2, First Words. */
const RENAMED_IN_V2: Readonly<Record<LevelId, LevelId>> = {
  'prologue-boot-path-01-first-boot': 'prologue-boot-path-02-first-words',
}

const renamed = (renames: Readonly<Record<LevelId, LevelId>>, id: unknown): unknown =>
  typeof id === 'string' ? (renames[id] ?? id) : id

/** A list of records with a `levelId` field, each renamed; anything else is left for validation. */
function renameIn(renames: Readonly<Record<LevelId, LevelId>>, list: unknown): unknown {
  if (!Array.isArray(list)) {
    return list
  }
  return list.map((entry: unknown) =>
    isRecord(entry) ? { ...entry, levelId: renamed(renames, entry.levelId) } : entry
  )
}

/**
 * Renames level ids everywhere a save keeps them: each level's progress, the
 * completion order, the Taint ledger and where "Continue" goes. Data it doesn't
 * recognize is left as is, for readSaveFile() to validate.
 */
export function renameLevels(renames: Readonly<Record<LevelId, LevelId>>): SaveMigration['migrate'] {
  return (save: SaveData) => {
    const progress = save.progress
    if (!isRecord(progress)) {
      return { ...save }
    }
    const order = progress.completionOrder
    const lastActive = progress.lastActive
    return {
      ...save,
      progress: {
        ...progress,
        levels: renameIn(renames, progress.levels),
        completionOrder: Array.isArray(order) ? order.map((id: unknown) => renamed(renames, id)) : order,
        taint: renameIn(renames, progress.taint),
        lastActive: isRecord(lastActive)
          ? { ...lastActive, levelId: renamed(renames, lastActive.levelId) }
          : lastActive,
      },
    }
  }
}

/** One entry per past save version; add one whenever SAVE_VERSION goes up. */
export const SAVE_MIGRATIONS: readonly SaveMigration[] = [{ from: 1, migrate: renameLevels(RENAMED_IN_V2) }]
