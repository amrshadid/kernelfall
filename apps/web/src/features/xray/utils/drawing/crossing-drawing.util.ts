import type { CrossingScene, CrossingStoryboard } from '@features/xray/types'
import {
  CARD_CHARS,
  CARD_MONO_CHARS,
  CROSSING_BOTTOM_PAD,
  CROSSING_CARD,
  CROSSING_FIT,
  CROSSING_LINE_Y,
  CROSSING_PARTS_TOP,
  CROSSING_PROGRAM,
  HARDWARE_GAP,
  PART_HEIGHT,
  PART_STEP,
  TERMINAL_GAP,
  TERMINAL_HEIGHT,
} from './crossing-drawing.constants'
import { firstLine, fitText, wrapText } from './drawing-text.util'
import { syscallReturnText } from './syscall-drawing.util'

/** Where things go on the crossing figure, and its text already cut to its boxes, for one beat. */
export interface CrossingDrawingLayout {
  readonly height: number
  /** The card's top: in Userland, on the Gate, or in the kernel beside its parts. */
  readonly cardY: number
  /** The card shows the answer, on its way back up. */
  readonly answering: boolean
  readonly partsY: readonly number[]
  readonly hardwareY: number | null
  readonly terminalY: number | null
  /** The terminal shows the bytes: from the device beat on. */
  readonly printed: boolean
  readonly text: {
    readonly title: string
    readonly callLine: string
    readonly returnLine: string
    readonly request: readonly string[]
    /** The path the call carries, in the code face under the plain words. */
    readonly path: string | null
    readonly footer: string
    readonly meaning: readonly string[]
    readonly terminal: string
  }
}

const REQUEST_LINES = 3
const MEANING_LINES = 2

export function crossingDrawingLayout(storyboard: CrossingStoryboard, scene: CrossingScene): CrossingDrawingLayout {
  const { call, parts, terminal, request, answer } = storyboard
  const answering = scene.beat === 'answer'
  const partsY = parts.map((_, i) => CROSSING_PARTS_TOP + i * PART_STEP)
  const partsBottom = (partsY.at(-1) ?? CROSSING_PARTS_TOP) + PART_HEIGHT
  const kernelBottom = Math.max(partsBottom, CROSSING_PARTS_TOP + CROSSING_CARD.height)
  const hardwareY = terminal !== null ? kernelBottom + HARDWARE_GAP : null
  const terminalY = hardwareY !== null ? hardwareY + TERMINAL_GAP : null
  const path = call.path !== null ? fitText(`"${call.path}"`, CARD_MONO_CHARS) : null

  const cardY =
    scene.beat === 'gate'
      ? CROSSING_LINE_Y - CROSSING_CARD.height / 2
      : scene.beat === 'kernel' || scene.beat === 'device'
        ? CROSSING_PARTS_TOP
        : CROSSING_PROGRAM.y

  return {
    height: (terminalY !== null ? terminalY + TERMINAL_HEIGHT : kernelBottom) + CROSSING_BOTTOM_PAD,
    cardY,
    answering,
    partsY,
    hardwareY,
    terminalY,
    printed: scene.beat === 'device' || answering,
    text: {
      title: fitText(`${call.program} · PID ${call.pid}`, CROSSING_FIT.title),
      callLine: fitText(call.text, CROSSING_FIT.programLine),
      returnLine: fitText(syscallReturnText(storyboard), CROSSING_FIT.programLine),
      request: wrapText(request, CARD_CHARS, path !== null ? REQUEST_LINES - 1 : REQUEST_LINES),
      path,
      footer: fitText(`${call.name} · syscall ${call.nr}`, CARD_MONO_CHARS),
      meaning: wrapText(answer.meaning, CARD_CHARS, MEANING_LINES),
      terminal: fitText(firstLine(terminal ?? ''), CROSSING_FIT.terminal),
    },
  }
}
