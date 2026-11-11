import type { CallGroup, CallListView, XrayDepth } from '@features/xray/types'
import { callListView } from '@features/xray/utils/call-list'
import { useCallback, useMemo, useState } from 'react'

const EMPTY: ReadonlyMap<string, boolean> = new Map()

export interface CallListInput {
  readonly groups: readonly CallGroup[]
  readonly depth: XrayDepth
  readonly live: boolean
  readonly selectedId: number | null
  /** What the player opened and closed belongs to one run. */
  readonly runId: number | null
}

export interface CallListState {
  readonly view: CallListView
  /** Every call is listed, not only the one on show; a crossing in the dock starts with one. */
  readonly all: boolean
  toggle(key: string): void
  toggleAll(): void
}

export function useCallList({ groups, depth, live, selectedId, runId }: CallListInput): CallListState {
  const [toggled, setToggled] = useState<{ runId: number | null; keys: ReadonlyMap<string, boolean> }>({
    runId,
    keys: new Map(),
  })
  const keys = toggled.runId === runId ? toggled.keys : EMPTY
  const view = useMemo(
    () => callListView(groups, { depth, live, selectedId, toggled: keys }),
    [groups, depth, live, selectedId, keys]
  )

  const toggle = useCallback(
    (key: string) => {
      const group = view.groups.find((g) => g.key === key)
      const row = view.groups.flatMap((g) => g.rows).find((r) => r.kind === 'fold' && r.key === key)
      const open = group?.open ?? (row?.kind === 'fold' && row.open)
      setToggled((current) => {
        const next = new Map(current.runId === runId ? current.keys : EMPTY)
        next.set(key, !open)
        return { runId, keys: next }
      })
    },
    [view, runId]
  )

  const [all, setAll] = useState(false)
  const toggleAll = useCallback(() => setAll((shown) => !shown), [])

  return { view, all, toggle, toggleAll }
}
