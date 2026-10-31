import { TAINT_POINTS_PER_SEGMENT, TAINT_SEGMENTS } from '@shared/constants/ui'

/** How many of the meter's segments are filled for `taint` points (any Taint fills at least one). */
export function filledSegments(taint: number): number {
  if (taint <= 0) {
    return 0
  }
  return Math.min(TAINT_SEGMENTS, Math.ceil(taint / TAINT_POINTS_PER_SEGMENT))
}

/** The meter's spoken value: "clean", "1 point", "4 points". */
export function taintLabel(taint: number): string {
  return taint <= 0 ? 'clean' : `${taint} point${taint === 1 ? '' : 's'}`
}
