import type { CrossingBeat } from '@features/xray/types'

/** Each beat's tick on the transport and its headline. */
export const BEAT_HEADS: Readonly<Record<CrossingBeat, { readonly tick: string; readonly title: string }>> = {
  ask: { tick: 'ask', title: '{program} asks the kernel' },
  gate: { tick: 'the Gate', title: 'Through the Gate' },
  kernel: { tick: 'kernel', title: 'The kernel does it' },
  device: { tick: 'terminal', title: 'The bytes reach the terminal' },
  answer: { tick: 'answer', title: 'The answer comes back' },
}

/** No-break spaces keep a number with its word when the card wraps. */
export const NO_BREAK = String.fromCharCode(0xa0)

export const YOUR_TERMINAL = 'your terminal'

/** One sentence per beat (ask and kernel only for a call CALL_SAY has no words for); backticks set the code face. */
export const SAY = {
  ask: '`{program}` asks the kernel for `{name}`, which {desk}.',
  gate: "The request crosses the Gate: the CPU switches to kernel mode, where only the kernel's code runs.",
  kernelFailed: 'The kernel tries, and stops: {errnoMessage}.',
  kernelPart: 'The work happens in {part}: the kernel {desk}.',
  kernel: 'The kernel does the work: it {desk}.',
  kernelEnd: ' It ends at {end}.',
  device: 'The bytes reach the terminal: `{printed}` appears on the screen.',
  answer: 'The answer comes back up through the Gate: {value}, {meaning}.',
  answerFailed:
    'The answer comes back up: an error. The C library hands `{program}` -1 and sets `errno` to `{errno}`: {errnoMessage}.',
  answerExec: 'No answer comes back to the old program: this process now runs `{newProgram}`.',
  answerExit: 'No answer comes back: the process is gone.',
  answerPending: 'No answer yet: the call is still waiting inside the kernel.',
  answerKilled: 'No answer: the process ended before the call could return.',
} as const

/** The answer card's line under the value. */
export const MEANING = {
  full: 'all {count} bytes taken',
  short: 'only {ret} of {count} taken',
  fork: "the new child's PID",
  worked: 'it worked',
  exec: 'now runs {newProgram}',
  exit: 'the process is gone',
  pending: 'still waiting',
  killed: 'the process ended first',
} as const

export const NO_ANSWER = 'none'

export const PREDICT = {
  question: 'What will the kernel answer?',
  explainWorked: '{value}: {meaning}. -1 would have meant the kernel refused.',
  explainFailed: '-1: the kernel refused, with `{errno}`: {errnoMessage}. Any other number would have meant it worked.',
} as const

/** The tty driver, when the call's bytes reached the console and no route names the driver. */
export const CONSOLE_DRIVER = 'tty driver'

/** The parts the kernel beat draws at most: the Section drawing's names, top to bottom. */
export const MAX_PARTS = 3
