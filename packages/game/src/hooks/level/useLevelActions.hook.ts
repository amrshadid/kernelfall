import { eventBus } from '@kernelfall/core/services'
import type { ServiceResponse } from '@kernelfall/core/types'
import { useMemo } from 'react'
import { getContent, getGameNow } from '#config'
import type { CodeReplacedPayload, LevelStartedPayload } from '#events/types'
import { GAME_EVENTS } from '#events/types'
import { useRunDispatch } from '#hooks/level/useRunDispatch.hook'
import { useAnnounceProgress } from '#hooks/saves/useAnnounceProgress.hook'
import { lockedLevelError, noActiveLevelError, unknownLevelError } from '#services/utils/error-handling.service'
import { useProgressStore } from '#store/progress.store'
import type { CheckVerdict } from '#types/definitions/checker'
import type { LevelId } from '#types/definitions/level'
import type { LevelRunState, OopsReport } from '#types/definitions/runner'
import type { DispatchResult } from '#types/definitions/session'
import { levelStatus, loadReferenceCode, startLevel as startLevelProgress } from '#utils/progress/index'
import { canTransition } from '#utils/runner/index'

const SOURCE = 'game/level'

type Step = Promise<ServiceResponse<DispatchResult>>

export interface UseLevelActionsResult {
  /** Resumes a saved play-through. Fails for unknown and locked levels. */
  start: (levelId: LevelId) => Promise<ServiceResponse<LevelRunState>>
  /** Plays the level again from its scene, dropping the play-through under way; the player's code stays. */
  replay: (levelId: LevelId) => Promise<ServiceResponse<LevelRunState>>
  /** Moves the loop on: scene → see it → build it, watch it → card → complete. */
  next: () => Step
  revealHint: () => Step
  /** A pass moves to "watch it". */
  submit: (verdict: CheckVerdict) => Step
  /** The kernel crashed: shows the oops, costs nothing. */
  oops: (report: OopsReport) => Step
  respawn: () => Step
  /** "Continue as is" after a pass with Taint: completes the level with that Taint. */
  acceptTaint: () => Step
  /** "Fix it first" after a pass with Taint: keeps building; the next passing run replaces it. */
  fixFirst: () => Step
  /** Never a dead end: no Taint, no score. The player's code is kept for `useLevelCode().restorePlayerCode`. */
  useReference: (reference?: Readonly<Record<string, string>>) => Step
  /** Idle gaps are capped. */
  recordActivity: () => void
}

/** Each action updates the store, emits game events and autosaves. */
export function useLevelActions(): UseLevelActionsResult {
  const { dispatchRun, recordActivity } = useRunDispatch()
  const { announceProgress } = useAnnounceProgress()

  return useMemo(() => {
    const store = useProgressStore.getState

    const open = async (levelId: LevelId, fresh: boolean): Promise<ServiceResponse<LevelRunState>> => {
      const content = getContent()
      const level = content.level(levelId)
      if (!level) return unknownLevelError(levelId)
      if (levelStatus(store().progress, content, level) === 'locked') {
        return lockedLevelError(levelId)
      }
      const at = getGameNow()
      const resumed = !fresh && store().progress.levels.some((record) => record.levelId === levelId && record.run)
      const started = startLevelProgress(store().progress, level, at, fresh)
      store().setProgress(started.progress)
      store().setActive({ level, run: started.run }, at)
      eventBus.emit<LevelStartedPayload>(GAME_EVENTS.LEVEL_STARTED, { levelId, resumed, at }, { source: SOURCE })
      await announceProgress(SOURCE)
      return { success: true, data: started.run }
    }

    const continueWithReference = async (reference?: Readonly<Record<string, string>>): Step => {
      const active = store().active
      if (!active) return noActiveLevelError()
      if (!canTransition(active.run, 'use_reference')) {
        return { success: true, data: { run: active.run, changed: false, unlocked: [] } }
      }
      if (reference) {
        store().setProgress(loadReferenceCode(store().progress, active.level.id, reference))
        eventBus.emit<CodeReplacedPayload>(
          GAME_EVENTS.CODE_REPLACED,
          { levelId: active.level.id, files: reference, owner: 'reference', at: getGameNow() },
          { source: SOURCE }
        )
      }
      return dispatchRun({ type: 'use_reference' })
    }

    return {
      start: (levelId) => open(levelId, false),
      replay: (levelId) => open(levelId, true),
      next: () => dispatchRun({ type: 'next' }),
      revealHint: () => dispatchRun({ type: 'reveal_hint' }),
      submit: (verdict) => dispatchRun({ type: 'submit', verdict }),
      oops: (report) => dispatchRun({ type: 'oops', report }),
      respawn: () => dispatchRun({ type: 'respawn' }),
      acceptTaint: () => dispatchRun({ type: 'accept_taint' }),
      fixFirst: () => dispatchRun({ type: 'fix_first' }),
      useReference: continueWithReference,
      recordActivity,
    }
  }, [dispatchRun, recordActivity, announceProgress])
}
