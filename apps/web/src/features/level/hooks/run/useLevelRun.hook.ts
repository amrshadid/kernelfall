import { useActiveLevel, useLevelActions } from '@kernelfall/game/hooks'
import type { LevelId, LevelRunState } from '@kernelfall/game/types'
import { useEffect, useState } from 'react'

export type LevelOpening =
  | { readonly status: 'opening' }
  /** `locked` when the player lacks the skills it needs; `missing` when no level has the id. */
  | { readonly status: 'unavailable'; readonly reason: 'locked' | 'missing' }
  | { readonly status: 'ready'; readonly run: LevelRunState }

export function useLevelRun(levelId: LevelId): LevelOpening {
  const { start } = useLevelActions()
  const active = useActiveLevel()
  const [failed, setFailed] = useState<'locked' | 'missing' | null>(null)

  useEffect(() => {
    let cancelled = false
    setFailed(null)
    void start(levelId).then((response) => {
      if (!cancelled && !response.success) {
        setFailed(response.error?.code === 'FORBIDDEN' ? 'locked' : 'missing')
      }
    })
    return () => {
      cancelled = true
    }
  }, [start, levelId])

  if (failed !== null) {
    return { status: 'unavailable', reason: failed }
  }
  return active.level?.id === levelId && active.run ? { status: 'ready', run: active.run } : { status: 'opening' }
}
