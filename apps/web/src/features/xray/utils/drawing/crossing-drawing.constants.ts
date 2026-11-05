import { MONO_CHAR_PX } from './drawing.constants'

// Kept short (about 250 units at 400 wide) so the whole crossing fits the dock at 1024×768.
export const CROSSING_PROGRAM = { x: 14, y: 22, width: 188, height: 58 } as const

/** The card that carries the request down and the answer up, in its own lane on the right. */
export const CROSSING_CARD = { x: 214, width: 172, height: 64, pad: 10 } as const
export const CARD_LINE = 15
/** Plain words at 13px, about 7px a character. */
export const CARD_CHARS = 21
export const CARD_MONO_CHARS = Math.floor((CROSSING_CARD.width - 2 * CROSSING_CARD.pad) / MONO_CHAR_PX)

export const CROSSING_LINE_Y = 104
/** The Gate's posts stand either side of the card's lane. */
export const GATE_POSTS = [CROSSING_CARD.x - 10, CROSSING_CARD.x + CROSSING_CARD.width + 3] as const
export const LANE_X = CROSSING_CARD.x + CROSSING_CARD.width / 2

export const CROSSING_KERNEL_LABEL_Y = CROSSING_LINE_Y + 22
export const CROSSING_PARTS_TOP = CROSSING_LINE_Y + 30
export const PART_X = 14
export const PART_HEIGHT = 28
export const PART_STEP = 32
export const PART_WIDTH = 188

/** The Hardware floor is one row: its title, then the terminal beside it. */
export const HARDWARE_GAP = 12
export const TERMINAL = { x: 120, width: 266, height: 30 } as const
export const CROSSING_BOTTOM_PAD = 8

/** How many characters each line holds before fitText cuts it. */
export const CROSSING_FIT = {
  title: 24,
  programLine: 25,
  part: 24,
  detail: 25,
  terminal: 25,
} as const
