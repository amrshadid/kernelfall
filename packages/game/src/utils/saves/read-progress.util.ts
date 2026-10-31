import { type Issues, ObjectReader } from '@kernelfall/core/utils'
import { HINT_TIERS } from '#types/definitions/hints'
import type { LastActive, LevelProgress, LevelResult, Progress, UnlockedAchievement } from '#types/definitions/progress'
import type { RunCheckpoint } from '#types/definitions/runner'
import { COMPLETION_VIAS, LEVEL_PHASES } from '#types/definitions/runner'
import type { TaintEntry } from '#types/definitions/taint'
import { TAINT_KINDS } from '#types/definitions/taint'

/** Reads a current-version `Progress` from untrusted save data. */
export function readProgress(value: unknown, path: string, issues: Issues): Progress {
  const progress = new ObjectReader(value, path, issues)
  return {
    levels: progress.list('levels', (entry, at) => readLevel(new ObjectReader(entry, at, issues))),
    completionOrder: progress.stringList('completionOrder'),
    taint: progress.list('taint', (entry, at) => readTaint(new ObjectReader(entry, at, issues))),
    achievements: progress.list('achievements', (entry, at) => readAchievement(new ObjectReader(entry, at, issues))),
    lastActive: progress.nullable('lastActive', (key) => readLastActive(progress.object(key))),
  }
}

function readLevel(level: ObjectReader): LevelProgress {
  return {
    levelId: level.string('levelId'),
    firstStartedAt: level.integer('firstStartedAt', 0),
    completedAt: level.nullable('completedAt', (key) => level.integer(key, 0)),
    activeMs: level.integer('activeMs', 0),
    attempts: level.integer('attempts', 0),
    oopses: level.integer('oopses', 0),
    run: level.nullable('run', (key) => readCheckpoint(level.object(key))),
    lastResult: level.nullable('lastResult', (key) => readResult(level.object(key))),
    best: level.nullable('best', (key) => readResult(level.object(key))),
    code: level.textMap('code'),
    ...(level.has('playerCode') && { playerCode: level.textMap('playerCode') }),
    labSnapshot: level.nullable('labSnapshot', (key) => level.string(key)),
  }
}

function readCheckpoint(run: ObjectReader): RunCheckpoint {
  return {
    phase: run.oneOf('phase', LEVEL_PHASES),
    hintsRevealed: run.integer('hintsRevealed', 0, HINT_TIERS.length),
    attempts: run.integer('attempts', 0),
    oopses: run.integer('oopses', 0),
  }
}

function readResult(result: ObjectReader): LevelResult {
  return {
    via: result.oneOf('via', COMPLETION_VIAS),
    score: result.integer('score', 0),
    taint: result.integer('taint', 0),
    hintsRevealed: result.integer('hintsRevealed', 0, HINT_TIERS.length),
    attempts: result.integer('attempts', 0),
    oopses: result.integer('oopses', 0),
  }
}

function readTaint(entry: ObjectReader): TaintEntry {
  return {
    levelId: entry.string('levelId'),
    ruleId: entry.string('ruleId'),
    kind: entry.oneOf('kind', TAINT_KINDS),
    points: entry.integer('points', 1),
    detail: entry.string('detail'),
  }
}

function readAchievement(achievement: ObjectReader): UnlockedAchievement {
  return { id: achievement.string('id'), unlockedAt: achievement.integer('unlockedAt', 0) }
}

function readLastActive(lastActive: ObjectReader): LastActive {
  return { levelId: lastActive.string('levelId'), phase: lastActive.oneOf('phase', LEVEL_PHASES) }
}
