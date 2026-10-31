import type { CallGroup, CallListView, CallRowView, XrayDepth } from '@features/xray/types'
import { FOLD_ROW_LIMIT } from './call-list.constants'

export interface CallListViewInput {
  readonly depth: XrayDepth
  readonly live: boolean
  readonly selectedId: number | null
  /** Rows and groups the player opened or closed, by key. */
  readonly toggled: ReadonlyMap<string, boolean>
}

/** What the list draws: Deep opens everything, Simple only the lesson; the selected call is never hidden. */
export function callListView(
  groups: readonly CallGroup[],
  { depth, live, selectedId, toggled }: CallListViewInput
): CallListView {
  const deep = depth === 'deep'
  return {
    live,
    groups: groups.map((group) => {
      const { rows, open: openAtFirst, ...rest } = group
      const holdsSelected = rows.some((row) =>
        row.kind === 'call' ? row.call.id === selectedId : row.calls.some((call) => call.id === selectedId)
      )
      const open = !live && (toggled.get(group.key) ?? (deep || openAtFirst || holdsSelected))
      const shown: CallRowView[] = open
        ? rows.map((row) => {
            if (row.kind === 'call') {
              return row
            }
            const taught = row.focused && row.fold === 'path-search'
            const foldOpen =
              toggled.get(row.key) ?? (deep || taught || row.calls.some((call) => call.id === selectedId))
            const drawn = foldOpen ? row.calls.slice(0, FOLD_ROW_LIMIT) : []
            return { ...row, open: foldOpen, shown: drawn, hidden: foldOpen ? row.calls.length - drawn.length : 0 }
          })
        : []
      return { ...rest, open, rows: shown }
    }),
  }
}
