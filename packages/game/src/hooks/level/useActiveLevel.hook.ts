import { useMemo } from 'react'
import { getGameConfig } from '#config'
import { useProgressStore } from '#store/progress.store'
import type { LevelDefinition } from '#types/definitions/level'
import type { LevelPhase, LevelRunEventType, LevelRunState } from '#types/definitions/runner'
import type { TaintEntry } from '#types/definitions/taint'
import { allowedEvents } from '#utils/runner/index'
import { levelTaint } from '#utils/taint/index'

export interface UseActiveLevelResult {
  readonly level: LevelDefinition | null
  readonly run: LevelRunState | null
  readonly phase: LevelPhase | null
  /** The level-loop events that do something right now; use it to enable buttons. */
  readonly allowed: ReadonlySet<LevelRunEventType>
  readonly canRevealHint: boolean
  readonly isComplete: boolean
  /** Taint points this play-through added: 0 until the level is passed. */
  readonly taint: number
  /** What the points are for, from the ledger, once the level is passed. */
  readonly taintEntries: readonly TaintEntry[]
}

const NONE: ReadonlySet<LevelRunEventType> = new Set()

export function useActiveLevel(): UseActiveLevelResult {
  const active = useProgressStore((state) => state.active)
  const ledger = useProgressStore((state) => state.progress.taint)

  return useMemo(() => {
    const run = active?.run ?? null
    const allowed = run ? new Set(allowedEvents(run)) : NONE
    const levelId = active?.level.id
    const passed = run?.outcome !== null && run?.outcome !== undefined
    return {
      level: active?.level ?? null,
      run,
      phase: run?.phase ?? null,
      allowed,
      canRevealHint: allowed.has('reveal_hint'),
      isComplete: run?.phase === 'complete',
      taint: passed && levelId ? levelTaint(ledger, levelId, getGameConfig()) : 0,
      taintEntries: passed && levelId ? ledger.filter((entry) => entry.levelId === levelId) : [],
    }
  }, [active, ledger])
}
