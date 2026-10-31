import type { XrayChoice, XrayLens } from '@features/xray/types'
import { LENS_LABELS, LENSES_OF_VIEW, WHOLE_RUN_LENSES } from './lenses.constants'

/** Whether the view draws a whole run at once, with no stages to play. */
export function isWholeRun(lens: XrayLens): boolean {
  return WHOLE_RUN_LENSES.has(lens)
}

/** In the level's order; Syscalls when the level unlocks none this panel draws. */
export function lensesOf(views: readonly string[] | undefined): readonly XrayChoice<XrayLens>[] {
  const lenses = [...new Set((views ?? []).flatMap((view) => LENSES_OF_VIEW[view] ?? []))]
  return (lenses.length > 0 ? lenses : (['syscalls'] as const)).map((id) => ({ id, label: LENS_LABELS[id] }))
}
