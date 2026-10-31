import type { NodeState } from '@shared/types'

/** What the map's stops are named by: their level, or the first skill it teaches. */
export type MapView = 'levels' | 'skills'

export interface MapDetailNeed {
  readonly id: string
  readonly met: boolean
}

/** Everything the side panel says about the selected stop. */
export interface MapDetail {
  /** "Act I · Process District · 1.4". */
  readonly place: string
  readonly title: string
  readonly state: NodeState
  readonly planned: boolean
  readonly status: string
  readonly skills: readonly { readonly id: string; readonly title: string }[]
  readonly needs: readonly MapDetailNeed[]
  readonly step: string | null
  readonly time: string
  readonly bestTaint: string
  readonly codex: readonly { readonly id: string; readonly term: string; readonly href: string }[]
  /** `null` while locked or not built. */
  readonly play: { readonly label: string; readonly href: string } | null
  readonly note: string | null
}
