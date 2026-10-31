import type { GameTuning } from '#types/definitions/config'
import { DEFAULT_GAME_TUNING } from '#types/definitions/config'
import type { GameContent } from '#types/definitions/content'
import type { Act, LevelDefinition } from '#types/definitions/level'
import { ACTS } from '#types/definitions/level'
import type { Progress } from '#types/definitions/progress'
import type { ActSummary, CompletionStats, ProgressSummary } from '#types/definitions/summary'
import { ENDING_ACTS } from '#types/definitions/taint'
import { collectCodex } from '#utils/codex/index'
import { completedLevelIds, progressSkills } from '#utils/progress/index'
import { selectEnding, totalTaint } from '#utils/taint/index'

const ENDING_ACT_SET: ReadonlySet<Act> = new Set(ENDING_ACTS)

export function summarizeProgress(
  progress: Progress,
  content: GameContent,
  tuning: GameTuning = DEFAULT_GAME_TUNING
): ProgressSummary {
  const completed = completedLevelIds(progress)
  const endingLevels = new Set(content.levels.filter((level) => ENDING_ACT_SET.has(level.act)).map((level) => level.id))
  return {
    overall: stats(content.levels.filter((level) => completed.has(level.id)).length, content.levels.length),
    acts: ACTS.map((act) => summarizeAct(act, content.levels, progress, completed, tuning)).filter(
      (act) => act.total > 0
    ),
    skills: stats(progressSkills(progress, content).size, content.skills.length),
    codexCards: collectCodex(progress, content).length,
    achievements: progress.achievements.length,
    totalTaint: totalTaint(progress.taint, undefined, tuning),
    activeMs: progress.levels.reduce((sum, level) => sum + level.activeMs, 0),
    projectedEnding: selectEnding(totalTaint(progress.taint, endingLevels, tuning), tuning),
  }
}

function summarizeAct(
  act: Act,
  levels: readonly LevelDefinition[],
  progress: Progress,
  completed: ReadonlySet<string>,
  tuning: GameTuning
): ActSummary {
  const ids = new Set(levels.filter((level) => level.act === act).map((level) => level.id))
  const done = [...ids].filter((id) => completed.has(id)).length
  return { act, ...stats(done, ids.size), taint: totalTaint(progress.taint, ids, tuning) }
}

function stats(completed: number, total: number): CompletionStats {
  return { completed, total, percent: total === 0 ? 0 : Math.floor((completed / total) * 100) }
}
