import { GAME_EVENTS } from '#events/types'
import type { EpochMs } from '#types/definitions/progress'
import type {
  ActiveLevelStep,
  ActiveLevelStepInput,
  RunStepEmission,
  RunStepEmissionsInput,
} from '#types/definitions/session'
import { ACHIEVEMENTS, unlockAchievements } from '#utils/achievements/index'
import { nextHintTier } from '#utils/hints/index'
import { addActiveTime, applyRunStep } from '#utils/progress/index'
import { transition } from '#utils/runner/level-runner.util'

/** Play time since the last activity, capped so an idle gap counts as at most `capMs`; null when nothing is timed. */
export function activeTimeSince(lastActivityAt: EpochMs | null, now: EpochMs, capMs: number): number | null {
  return lastActivityAt === null ? null : Math.min(now - lastActivityAt, capMs)
}

/** One level-loop event folded into the progress, with the achievements it earned; null when it doesn't apply. */
export function stepActiveLevel(input: ActiveLevelStepInput): ActiveLevelStep | null {
  const { active, event, options, content, now, activeMs } = input
  const after = transition(active.run, event, options)
  if (after === active.run) {
    return null
  }
  const played = activeMs === null ? input.progress : addActiveTime(input.progress, active.level.id, activeMs)
  const stepped = applyRunStep(played, { level: active.level, before: active.run, after, now })
  const earned = unlockAchievements(stepped, content, options.achievements ?? ACHIEVEMENTS, now)
  return { after, progress: earned.progress, unlocked: earned.unlocked }
}

/** The events a step announces: a hint shown, the level completed, then each achievement earned. */
export function runStepEmissions(input: RunStepEmissionsInput): readonly RunStepEmission[] {
  const { before, after, unlocked, lastResult, at } = input
  const emissions: RunStepEmission[] = []
  const tier = after.hintsRevealed > before.hintsRevealed ? nextHintTier(before.hintsRevealed) : null
  if (tier) {
    emissions.push({ name: GAME_EVENTS.HINT_REVEALED, payload: { levelId: after.levelId, tier, at } })
  }
  if (after.outcome && !before.outcome) {
    emissions.push({
      name: GAME_EVENTS.LEVEL_COMPLETED,
      payload: {
        levelId: after.levelId,
        via: after.outcome.via,
        score: after.outcome.score,
        taint: lastResult?.taint ?? 0,
        at,
      },
    })
  }
  for (const achievement of unlocked) {
    emissions.push({
      name: GAME_EVENTS.ACHIEVEMENT_UNLOCKED,
      payload: { achievementId: achievement.id, title: achievement.title, at },
    })
  }
  return emissions
}
