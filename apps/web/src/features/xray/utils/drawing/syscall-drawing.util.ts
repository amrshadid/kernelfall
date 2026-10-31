import type { DrawingTableRow, SyscallScene, SyscallStoryboard, XrayDepth } from '@features/xray/types'
import { CELL_HEIGHT } from './drawing.constants'
import { firstLine, fitText } from './drawing-text.util'
import {
  KERNEL_BUFFER_GAP,
  KERNEL_BUFFER_HEIGHT,
  POINTER_Y,
  PT_REGS_HEIGHT,
  SHOWN_ARGS,
  SLIP_CHARS,
  SYSCALL_BOTTOM_PAD,
  SYSCALL_DESK_HEIGHT,
  SYSCALL_FIT,
  SYSCALL_KERNEL_PAD,
  SYSCALL_KERNEL_TOP,
  SYSCALL_LINE_Y,
  SYSCALL_PATH_ROW,
  SYSCALL_PATH_TOP,
  SYSCALL_USER_BUFFER_Y,
} from './syscall-drawing.constants'

/** Where things go on the syscall figure, for one scene at one depth. */
export interface SyscallDrawingLayout {
  readonly height: number
  readonly kernelBufferY: number
  readonly pointerY: number
  readonly inKernel: boolean
  readonly write: boolean
  readonly toScreen: boolean
  readonly showBuffer: boolean
  /** The kernel's copy of the buffer is drawn; a bad fd fails before any copy. */
  readonly kernelBuffer: boolean
  /** The syscall number in the Gatekeeper's slot. */
  readonly slot: string
  readonly registers: readonly DrawingTableRow[]
  readonly ptRegs: readonly DrawingTableRow[]
}

/** The syscall figure's text lines, each already cut to its box. */
export interface SyscallDrawingText {
  readonly title: string
  readonly callLine: string
  readonly returnLine: string
  readonly slip: readonly string[]
  readonly answer: string
  readonly path: string
  readonly console: string
  readonly deskSay: string
}

/** What the program has back at the end, as the program box prints it. */
export function syscallReturnText(storyboard: SyscallStoryboard): string {
  const { call } = storyboard
  const { outcome } = call
  if (outcome.kind !== 'returned') {
    return outcome.kind === 'exited' ? 'never returns' : 'still waiting'
  }
  if (outcome.errno !== null) {
    return `→ -1, errno = ${outcome.errno}`
  }
  if (call.family === 'execve') {
    return `→ now running ${call.path?.split('/').at(-1) ?? 'a new program'}`
  }
  return `→ ${outcome.toProgram}`
}

/** The request slip's lines at Simple: the call's arguments in plain words, each short enough for the slip. */
export function slipLines(storyboard: SyscallStoryboard): readonly string[] {
  const { call } = storyboard
  if (call.family === 'write' && call.buffer) {
    // The buffer itself is drawn beside the slip, so its size is enough here.
    return [`fd ${call.args[0]?.value ?? '?'}`, fitText(`${call.buffer.count} bytes`, SLIP_CHARS)]
  }
  if (call.path !== null) {
    return [fitText(`"${call.path}"`, SLIP_CHARS)]
  }
  return call.args.slice(0, 2).map((arg) => fitText(`${arg.name} ${arg.value}`, SLIP_CHARS))
}

export function syscallDrawingText(storyboard: SyscallStoryboard, scene: SyscallScene): SyscallDrawingText {
  const { call } = storyboard
  const returned = call.outcome.kind === 'returned' ? call.outcome : null
  return {
    title: fitText(`${call.program} · PID ${call.pid}`, SYSCALL_FIT.title),
    callLine: fitText(call.text, SYSCALL_FIT.programLine),
    returnLine: fitText(syscallReturnText(storyboard), SYSCALL_FIT.programLine),
    slip: slipLines(storyboard),
    answer: returned ? fitText(`answer: ${returned.ret}`, SLIP_CHARS) : '',
    path: fitText(`"${call.path ?? ''}"`, SYSCALL_FIT.path),
    console: fitText(firstLine(call.console ?? ''), SYSCALL_FIT.console),
    deskSay: fitText(scene.desk.say, SYSCALL_FIT.deskSay),
  }
}

function pointerYOf(storyboard: SyscallStoryboard, scene: SyscallScene, depth: XrayDepth, showBuffer: boolean): number {
  switch (scene.step) {
    case 'call':
      return POINTER_Y.call
    case 'registers':
      return showBuffer ? SYSCALL_USER_BUFFER_Y + CELL_HEIGHT / 2 : POINTER_Y.registers
    case 'gate':
      return SYSCALL_LINE_Y
    case 'sysret':
      return POINTER_Y.sysret
    default: {
      const activeRow = storyboard.path.findIndex((name) => scene.active.includes(name))
      return depth === 'deep' && activeRow >= 0
        ? SYSCALL_KERNEL_TOP + SYSCALL_PATH_TOP + activeRow * SYSCALL_PATH_ROW + Math.floor(SYSCALL_PATH_ROW / 2)
        : SYSCALL_KERNEL_TOP + POINTER_Y.kernelOffset
    }
  }
}

export function syscallDrawingLayout(
  storyboard: SyscallStoryboard,
  scene: SyscallScene,
  depth: XrayDepth
): SyscallDrawingLayout {
  const { call, path } = storyboard
  const inKernel = scene.ring === 0
  const write = call.family === 'write'
  const toScreen = write && call.console !== null
  const showBuffer = write && call.buffer !== null
  const kernelBuffer = showBuffer && !(call.outcome.kind === 'returned' && call.outcome.errno === 'EBADF')
  const deepBottom = Math.max(
    SYSCALL_KERNEL_TOP + SYSCALL_PATH_TOP + path.length * SYSCALL_PATH_ROW,
    SYSCALL_KERNEL_TOP + PT_REGS_HEIGHT
  )
  const kernelBottom = (depth === 'deep' ? deepBottom : SYSCALL_KERNEL_TOP + SYSCALL_DESK_HEIGHT) + SYSCALL_KERNEL_PAD
  const returned = call.outcome.kind === 'returned' ? call.outcome : null
  const args = call.args.slice(0, SHOWN_ARGS)

  return {
    height: kernelBottom + (kernelBuffer ? KERNEL_BUFFER_HEIGHT : 0) + SYSCALL_BOTTOM_PAD,
    kernelBufferY: kernelBottom + KERNEL_BUFFER_GAP,
    pointerY: pointerYOf(storyboard, scene, depth, showBuffer),
    inKernel,
    write,
    toScreen,
    showBuffer,
    kernelBuffer,
    slot: inKernel || scene.step === 'gate' ? String(call.nr) : '',
    registers: [
      {
        label: 'mode',
        value: inKernel ? 'ring 0' : 'ring 3',
        on: scene.step === 'gate' || scene.step === 'sysret',
        flip: true,
      },
      {
        label: 'eax',
        value: !scene.loaded ? '—' : scene.back && returned ? String(returned.ret) : String(call.nr),
        on: scene.step === 'registers' || scene.step === 'sysret',
      },
      ...args.map((arg) => ({
        label: arg.register,
        value: scene.loaded ? fitText(arg.value, SYSCALL_FIT.register) : '—',
        on: scene.step === 'registers',
      })),
    ],
    ptRegs: [
      { label: 'orig_ax', value: scene.saved ? String(call.nr) : '', on: scene.step === 'entry' },
      {
        label: 'ax',
        value: !scene.saved ? '' : scene.answered && returned ? String(returned.ret) : '-ENOSYS',
        on: scene.step === 'answer',
      },
      ...args.map((arg) => ({ label: arg.ptReg, value: scene.saved ? fitText(arg.value, SYSCALL_FIT.ptReg) : '' })),
    ],
  }
}
