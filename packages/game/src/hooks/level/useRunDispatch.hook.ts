import { eventBus } from '@kernelfall/core/services'
import type { ServiceResponse } from '@kernelfall/core/types'
import { useMemo } from 'react'
import { getContent, getGameConfig, getGameNow } from '#config'
import { useAnnounceProgress } from '#hooks/saves/useAnnounceProgress.hook'
import { noActiveLevelError } from '#services/utils/error-handling.service'
import { useProgressStore } from '#store/progress.store'
import type { LevelRunEvent } from '#types/definitions/runner'
import type { DispatchResult } from '#types/definitions/session'
import { addActiveTime, findLevelProgress } from '#utils/progress/index'
import { activeTimeSince, runStepEmissions, stepActiveLevel } from '#utils/runner/index'

const SOURCE = 'game/level'

export interface UseRunDispatchResult {
  /** Applies a level-loop event to the active level; saves if it changed anything. */
  readonly dispatchRun: (event: LevelRunEvent) => Promise<ServiceResponse<DispatchResult>>
  /** Counts play time since the last activity (idle gaps capped). Doesn't save. */
  readonly recordActivity: () => void
}

/** The level loop's one step, shared by the hooks that move it (level actions, hints, the checker). */
export function useRunDispatch(): UseRunDispatchResult {
  const { announceProgress } = useAnnounceProgress()

  return useMemo(() => {
    const store = useProgressStore.getState
    const activeMs = (now: number) => activeTimeSince(store().lastActivityAt, now, getGameConfig().activeTimeIdleCapMs)

    const recordActivity = () => {
      const { active, progress } = store()
      const now = getGameNow()
      const played = activeMs(now)
      if (!active || played === null) {
        return
      }
      store().touch(addActiveTime(progress, active.level.id, played), now)
    }

    const dispatchRun = async (event: LevelRunEvent): Promise<ServiceResponse<DispatchResult>> => {
      const { active, progress, lastActivityAt } = store()
      if (!active) return noActiveLevelError()
      const now = getGameNow()
      const step = stepActiveLevel({
        progress,
        active,
        event,
        options: getGameConfig(),
        content: getContent(),
        now,
        activeMs: activeMs(now),
      })
      if (!step) {
        return { success: true, data: { run: active.run, changed: false, unlocked: [] } }
      }
      store().setProgress(step.progress)
      store().setActive({ level: active.level, run: step.after }, lastActivityAt === null ? null : now)
      const lastResult = findLevelProgress(step.progress, active.level.id)?.lastResult ?? null
      for (const emission of runStepEmissions({
        before: active.run,
        after: step.after,
        unlocked: step.unlocked,
        lastResult,
        at: now,
      })) {
        eventBus.emit(emission.name, emission.payload, { source: SOURCE })
      }
      await announceProgress(SOURCE)
      return { success: true, data: { run: step.after, changed: true, unlocked: step.unlocked } }
    }

    return { dispatchRun, recordActivity }
  }, [announceProgress])
}
