import { useEffect, useRef } from 'react'
import { useProgressStore } from '#store/progress.store'
import type { CheckVerdict } from '#types/definitions/checker'
import type { RunAsCue } from '#types/definitions/level'

/**
 * Hands the active level's `runAs` cues to `run` (the app passes the Machine's `runAs`), each once,
 * on the first verdict after mounting that has its objective met.
 */
export function useRunAsCues(run: (cue: RunAsCue) => void): void {
  const active = useProgressStore((state) => state.active)
  const verdict = active?.run.lastVerdict ?? null
  const latestRun = useRef(run)
  latestRun.current = run
  // A verdict from before mounting (a resumed save) met its objective on a Machine since set up again.
  const seen = useRef<CheckVerdict | null>(verdict)
  const fired = useRef(new Set<RunAsCue>())
  const levelId = active?.level.id

  useEffect(() => {
    if (levelId === undefined) {
      return
    }
    fired.current = new Set()
  }, [levelId])

  useEffect(() => {
    if (!active || verdict === seen.current) {
      return
    }
    seen.current = verdict
    // A replay starts with no verdict: its cues are due again.
    if (verdict === null) {
      fired.current = new Set()
      return
    }
    for (const cue of active.level.runAs ?? []) {
      if (!fired.current.has(cue) && !verdict.missing.some((objective) => objective.id === cue.after)) {
        fired.current.add(cue)
        latestRun.current(cue)
      }
    }
  }, [active, verdict])
}
