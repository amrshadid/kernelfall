import type { MapDetail } from '@features/map/types'

/** How long a level takes before the player has played it, when its level.yaml doesn't say. */
export const TYPICAL_LEVEL_TIME = 'About 20 min'

export const PLAN_NOTES = {
  side: 'A side level, still being built. The main road goes on without it.',
  main: 'This level is still being built. Its place on the map is already drawn.',
  locked: 'Locked until you have the skills it needs.',
} as const

/** The panel with no stop selected: a map with no stops at all. */
export const EMPTY_DETAIL: MapDetail = {
  place: '',
  title: 'Kernel Map',
  state: 'locked',
  planned: false,
  status: '',
  skills: [],
  needs: [],
  step: null,
  time: '',
  bestTaint: '',
  codex: [],
  play: null,
  note: null,
}
