import { MONO_CHAR_PX, TABLE_HEAD } from './drawing.constants'

export const SYSCALL_LINE_Y = 214
export const SYSCALL_KERNEL_TOP = 246
export const SYSCALL_PATH_ROW = 17
/** The Deep call path's first row sits this far under the kernel's top. */
export const SYSCALL_PATH_TOP = 18
export const SYSCALL_USER_BUFFER_Y = 114
/** The request slip and the CPU registers share the right column. */
export const SYSCALL_RIGHT_X = 262
export const SYSCALL_RIGHT_W = 124
// On the section line itself: clear of the boxes above, the zone title below and the Gate's posts.
export const SYSCALL_TAG_X = 150
/** The request slip's text starts this far in from its edge, and stops as far from the other. */
export const SLIP_PAD = 10
export const SLIP_CHARS = Math.floor((SYSCALL_RIGHT_W - 2 * SLIP_PAD) / MONO_CHAR_PX)

/** Simple's "In the kernel now" box. */
export const SYSCALL_DESK_HEIGHT = 84
/** pt_regs at Deep: orig_ax, ax and the three argument registers. */
export const PT_REGS_ROWS = 5
export const REGISTER_ROW = 18
export const PT_REGS_HEIGHT = TABLE_HEAD + 4 + PT_REGS_ROWS * REGISTER_ROW
export const SYSCALL_KERNEL_PAD = 10
/** The kernel's copy of the buffer: its title, cells and caption. */
export const KERNEL_BUFFER_HEIGHT = 56
export const KERNEL_BUFFER_GAP = 22
export const SYSCALL_BOTTOM_PAD = 8

/** Where the red pointer stops, per step outside the kernel. */
export const POINTER_Y = {
  call: 62,
  registers: 84,
  sysret: 80,
  /** "In the kernel now" at Simple, or Deep before the call path is reached. */
  kernelOffset: 40,
} as const

/** How many characters each line holds before fitText cuts it. */
export const SYSCALL_FIT = {
  title: 32,
  programLine: 31,
  path: 34,
  console: 36,
  deskSay: 52,
  register: 10,
  ptReg: 9,
} as const

/** Registers drawn for the call's arguments; the rest stay off the sheet. */
export const SHOWN_ARGS = 3
