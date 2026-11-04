import { MONO_CHAR_PX } from './drawing.constants'

export const CROSSING_PROGRAM = { x: 14, y: 26, width: 188, height: 70 } as const

/** The card that carries the request down and the answer up, in its own lane on the right. */
export const CROSSING_CARD = { x: 214, width: 172, height: 86, pad: 10 } as const
export const CARD_LINE = 16
/** Plain words at 13px, about 7px a character. */
export const CARD_CHARS = 21
export const CARD_MONO_CHARS = Math.floor((CROSSING_CARD.width - 2 * CROSSING_CARD.pad) / MONO_CHAR_PX)

export const CROSSING_LINE_Y = 140
/** The Gate's posts stand either side of the card's lane. */
export const GATE_POSTS = [CROSSING_CARD.x - 10, CROSSING_CARD.x + CROSSING_CARD.width + 3] as const
export const LANE_X = CROSSING_CARD.x + CROSSING_CARD.width / 2

export const CROSSING_KERNEL_LABEL_Y = CROSSING_LINE_Y + 24
export const CROSSING_PARTS_TOP = CROSSING_LINE_Y + 36
export const PART_HEIGHT = 32
export const PART_STEP = 38
export const PART_WIDTH = 188

/** From the kernel's last box to the Hardware floor's title, and from it to the terminal. */
export const HARDWARE_GAP = 32
export const TERMINAL_GAP = 10
export const TERMINAL_HEIGHT = 50
export const CROSSING_BOTTOM_PAD = 12

/** How many characters each line holds before fitText cuts it. */
export const CROSSING_FIT = {
  title: 24,
  programLine: 25,
  part: 24,
  detail: 25,
  terminal: 25,
} as const
