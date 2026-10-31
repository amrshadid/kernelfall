import type { PsState } from '@features/xray/types'

// The band above the program boxes carries the SIGCHLD arc, clear of the zone title.
export const PROCESS_BOX_Y = 46
export const PROCESS_LINE_Y = 234
export const PROCESS_KERNEL_TOP = 266
export const PROCESS_NOW_Y = 394
export const PROCESS_HEIGHT = 458
// A crossing tag sits on the line but raised, so it clears the "Kernel space" heading right under it.
export const CROSSING_LIFT = 8
/** A crossing tag starts this far into its process's column. */
export const CROSSING_INSET = 14
export const PROCESS_BOX_W = 180
export const PARENT_X = 14
export const CHILD_X = 206

/** The red pointer: left of the parent's column, or just inside the gap before the child's. */
export const POINTER_X = { parent: 2, childGap: 12 } as const
/** The red pointer's height in a program box, and in the kernel. */
export const POINTER_DROP = { user: 40, kernel: 46 } as const

export const PAGES = ['code', 'data', 'heap', 'stack'] as const
/** A new program brings its own code and data; heap and stack start empty. */
export const NEW_PROGRAM_PAGE = 'new'
export const PAGE = { width: 38, step: 41, height: 20, top: 78, baseline: 92 } as const

export const STATE_TEXT: Record<PsState, string> = {
  R: 'R  running',
  S: 'S  sleeping',
  Z: 'Z  zombie',
  gone: 'released',
}

/** How many characters each line holds before fitText cuts it. */
export const PROCESS_FIT = {
  title: 24,
  parentLine: 25,
  comm: 15,
  printed: 37,
  now: 46,
} as const
