import type { LevelDefinition, LevelId } from '#types/definitions/level'
import type { EpochMs, LevelProgress, LevelResult, Progress, RunStep } from '#types/definitions/progress'
import type { LevelOutcome, LevelRunState } from '#types/definitions/runner'
import { priceTaint } from '#utils/checker/evaluate-check.util'
import { betterResult, findLevelProgress } from '#utils/progress/progress-queries.util'
import { checkpointOf, createLevelRun, resumeLevelRun } from '#utils/runner/level-runner.util'
import { replaceLevelTaint } from '#utils/taint/index'

/**
 * Starts or resumes a level: an unfinished play-through continues where it was
 * saved, otherwise a new one begins at the scene. `fresh` always begins a new one (a replay).
 */
export function startLevel(
  progress: Progress,
  level: LevelDefinition,
  now: EpochMs,
  fresh = false
): { readonly progress: Progress; readonly run: LevelRunState } {
  const record = findLevelProgress(progress, level.id) ?? newLevelProgress(level.id, now)
  const run =
    record.run && !fresh
      ? resumeLevelRun(level.id, record.run, savedOutcome(progress, record))
      : createLevelRun(level.id)
  const updated = { ...record, run: checkpointOf(run) }
  return {
    progress: {
      ...putLevel(progress, updated),
      lastActive: { levelId: level.id, phase: run.phase },
    },
    run,
  }
}

/**
 * Folds one level-loop transition into the progress: the checkpoint, counters,
 * "Continue" target and, when the run just produced an outcome, the completion.
 */
export function applyRunStep(progress: Progress, step: RunStep): Progress {
  const { level, before, after, now } = step
  const record = findLevelProgress(progress, level.id) ?? newLevelProgress(level.id, now)
  let updated: LevelProgress = {
    ...record,
    run: after.phase === 'complete' ? null : checkpointOf(after),
    attempts: record.attempts + Math.max(0, after.attempts - before.attempts),
    oopses: record.oopses + Math.max(0, after.oopses - before.oopses),
  }
  let next: Progress = progress
  if (after.outcome && !before.outcome) {
    const entries = priceTaint(level, after.outcome.taint)
    const result = resultOf(
      after,
      after.outcome,
      entries.reduce((sum, entry) => sum + entry.points, 0)
    )
    updated = {
      ...updated,
      completedAt: updated.completedAt ?? now,
      lastResult: result,
      best: betterResult(updated.best, result),
    }
    next = {
      ...next,
      taint: replaceLevelTaint(next.taint, level.id, entries),
      completionOrder: next.completionOrder.includes(level.id)
        ? next.completionOrder
        : [...next.completionOrder, level.id],
    }
  }
  return { ...putLevel(next, updated), lastActive: { levelId: level.id, phase: after.phase } }
}

export function addActiveTime(progress: Progress, levelId: LevelId, ms: number): Progress {
  return updateLevel(progress, levelId, (record) => ({
    ...record,
    activeMs: record.activeMs + Math.max(0, ms),
  }))
}

export function setLevelCode(progress: Progress, levelId: LevelId, code: Readonly<Record<string, string>>): Progress {
  return updateLevel(progress, levelId, (record) => ({ ...record, code: { ...code } }))
}

/**
 * Puts init's version in the level's code and keeps the player's own beside it.
 * Loading init's version again keeps the player's first copy, never init's.
 */
export function loadReferenceCode(
  progress: Progress,
  levelId: LevelId,
  reference: Readonly<Record<string, string>>
): Progress {
  return updateLevel(progress, levelId, (record) => ({
    ...record,
    code: { ...reference },
    playerCode: record.playerCode ?? record.code,
  }))
}

/** Brings back the player's own code after init's version was loaded; no change if none was kept. */
export function restorePlayerCode(progress: Progress, levelId: LevelId): Progress {
  return updateLevel(progress, levelId, (record) => {
    if (!record.playerCode) {
      return record
    }
    const { playerCode, ...rest } = record
    return { ...rest, code: playerCode }
  })
}

/**
 * Completes levels a placement check placed the player past: unplayed, with no
 * score and no Taint. A level already completed keeps its own result.
 */
export function placeLevels(progress: Progress, levelIds: readonly LevelId[], now: EpochMs): Progress {
  const placement: LevelResult = { via: 'placement', score: 0, taint: 0, hintsRevealed: 0, attempts: 0, oopses: 0 }
  return levelIds.reduce((next, levelId) => {
    const record = findLevelProgress(next, levelId) ?? newLevelProgress(levelId, now)
    if (record.completedAt !== null) {
      return next
    }
    const placed = { ...record, completedAt: now, lastResult: placement, best: betterResult(record.best, placement) }
    return { ...putLevel(next, placed), completionOrder: [...next.completionOrder, levelId] }
  }, progress)
}

export function setLabSnapshot(progress: Progress, levelId: LevelId, key: string | null): Progress {
  return updateLevel(progress, levelId, (record) => ({ ...record, labSnapshot: key }))
}

function resultOf(run: LevelRunState, outcome: LevelOutcome, taint: number): LevelResult {
  return {
    via: outcome.via,
    score: outcome.score,
    taint,
    hintsRevealed: outcome.hintsRevealed,
    attempts: run.attempts,
    oopses: run.oopses,
  }
}

/** The outcome shown again when a run is resumed after it already passed. */
function savedOutcome(progress: Progress, record: LevelProgress): LevelOutcome | null {
  const result = record.lastResult
  const passedThisRun = record.run?.phase === 'watch' || record.run?.phase === 'card'
  if (!result || !passedThisRun) {
    return null
  }
  const taint = progress.taint
    .filter((entry) => entry.levelId === record.levelId)
    .map(({ ruleId, detail }) => ({ ruleId, detail }))
  return { via: result.via, taint, hintsRevealed: result.hintsRevealed, score: result.score }
}

function newLevelProgress(levelId: LevelId, now: EpochMs): LevelProgress {
  return {
    levelId,
    firstStartedAt: now,
    completedAt: null,
    activeMs: 0,
    attempts: 0,
    oopses: 0,
    run: null,
    lastResult: null,
    best: null,
    code: {},
    labSnapshot: null,
  }
}

function putLevel(progress: Progress, record: LevelProgress): Progress {
  const exists = progress.levels.some((level) => level.levelId === record.levelId)
  const levels = exists
    ? progress.levels.map((level) => (level.levelId === record.levelId ? record : level))
    : [...progress.levels, record]
  return { ...progress, levels }
}

/** Applies `change` to a started level; leaves progress as is for a level never started. */
function updateLevel(progress: Progress, levelId: LevelId, change: (record: LevelProgress) => LevelProgress): Progress {
  const record = findLevelProgress(progress, levelId)
  return record ? putLevel(progress, change(record)) : progress
}
