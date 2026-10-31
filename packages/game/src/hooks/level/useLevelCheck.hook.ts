import { useEventListener } from '@kernelfall/core/hooks'
import { handleServiceError } from '@kernelfall/core/services'
import type { ServiceResponse } from '@kernelfall/core/types'
import type { BootedPayload, CommandFinishedPayload } from '@kernelfall/machine/events'
import { LAB_EVENTS } from '@kernelfall/machine/events'
import { useCallback, useMemo, useRef } from 'react'
import { getContent } from '#config'
import { useRunDispatch } from '#hooks/level/useRunDispatch.hook'
import { useProgressStore } from '#store/progress.store'
import type { CheckInput, CheckVerdict } from '#types/definitions/checker'
import type { LevelId, Objective } from '#types/definitions/level'
import type { TaintEvent } from '#types/definitions/taint'
import { evaluateCheck, mergeVerdicts } from '#utils/checker/index'
import { compileReport } from '#utils/queries/compiler-queries.util'

const NO_TAINT: readonly TaintEvent[] = []

export interface UseLevelCheckResult {
  /** Null before the first judged run. */
  readonly verdict: CheckVerdict | null
  readonly missing: readonly Objective[]
  /** False for a level only init's version finishes. */
  readonly hasChecker: boolean
  /** Taint of a passing run while the level waits for "Fix it first" or "Continue as is". */
  readonly heldTaint: readonly TaintEvent[]
  /** Null when there was nothing to judge: another step, no checker, or not the player's program. */
  readonly check: (payload: CommandFinishedPayload) => Promise<ServiceResponse<CheckVerdict | null>>
}

/** Judges every command finished in "build it". Mount it once, where the level is played. */
export function useLevelCheck(): UseLevelCheckResult {
  const active = useProgressStore((state) => state.active)
  const { dispatchRun } = useRunDispatch()
  // A failed build runs no program, so its command isn't judged; it is remembered here instead,
  // with the latest compile's errors for the commands that compile nothing.
  // SIMPLIFIED: kept in memory only, so a reload forgets it.
  const failedBuildIn = useRef<LevelId | null>(null)
  const latestBuild = useRef<{ readonly levelId: LevelId; readonly errors: number } | null>(null)

  const judge = useCallback(
    async (inputFor: (levelId: LevelId) => CheckInput): Promise<ServiceResponse<CheckVerdict | null>> => {
      const current = useProgressStore.getState().active
      if (current?.run.phase !== 'build') {
        return { success: true, data: null }
      }
      const checker = getContent().checker(current.level.id)
      const input = inputFor(current.level.id)
      if (!checker || (checker.applies && !checker.applies(input))) {
        return { success: true, data: null }
      }
      let verdict: CheckVerdict
      try {
        verdict = mergeVerdicts(current.run.lastVerdict, evaluateCheck(current.level, checker, input))
      } catch (error) {
        // A checker naming an objective the level doesn't have is a bug in the level, not the player's.
        return handleServiceError(error)
      }
      const submitted = await dispatchRun({ type: 'submit', verdict })
      if (!submitted.success) {
        return submitted.error ? { success: false, error: submitted.error } : { success: false }
      }
      return { success: true, data: verdict }
    },
    [dispatchRun]
  )

  const check = useCallback(
    (payload: CommandFinishedPayload) =>
      judge((levelId) => {
        // gcc runs inside the Machine, so its diagnostics are in the command's own events.
        const compiled = compileReport(payload.events)
        if (compiled) {
          latestBuild.current = { levelId, errors: compiled.errors }
        }
        const latestErrors = latestBuild.current?.levelId === levelId ? latestBuild.current.errors : 0
        const builds = { failedEarlier: failedBuildIn.current === levelId, latestErrors }
        if (compiled && compiled.errors > 0) {
          failedBuildIn.current = levelId
        }
        return { events: payload.events, warnings: compiled?.warnings ?? [], builds }
      }),
    [judge]
  )

  useEventListener<CommandFinishedPayload>(LAB_EVENTS.COMMAND_FINISHED, (event) => {
    void check(event.payload)
  })

  useEventListener<BootedPayload>(LAB_EVENTS.BOOTED, (event) => {
    void judge(() => ({ events: [], boot: event.payload.boot }))
  })

  return useMemo(() => {
    const verdict = active?.run.lastVerdict ?? null
    return {
      verdict,
      missing: verdict ? verdict.missing : (active?.level.objectives ?? []),
      hasChecker: active ? getContent().checker(active.level.id) !== undefined : false,
      heldTaint: active?.run.heldPass?.taint ?? NO_TAINT,
      check,
    }
  }, [active, check])
}
