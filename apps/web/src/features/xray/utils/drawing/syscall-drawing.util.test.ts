import type { SyscallStoryboard } from '@features/xray/types'
import { toXrayCalls } from '@features/xray/utils/calls'
import { syscallStoryboard } from '@features/xray/utils/syscalls'
import { xrayContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { bytes, type EventInit, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { CELL_HEIGHT } from './drawing.constants'
import {
  KERNEL_BUFFER_HEIGHT,
  SLIP_CHARS,
  SYSCALL_KERNEL_TOP,
  SYSCALL_LINE_Y,
  SYSCALL_USER_BUFFER_Y,
} from './syscall-drawing.constants'
import { slipLines, syscallDrawingLayout, syscallDrawingText, syscallReturnText } from './syscall-drawing.util'

const content = xrayContent()

function storyboardOf(inits: readonly EventInit[]): SyscallStoryboard {
  const events = stamp(inits)
  const [call] = toXrayCalls(runOf(events, './hello'), events, content)
  if (!call) {
    throw new Error('no call')
  }
  return syscallStoryboard(call, content.narration)
}

const write = (count: number, ret: number) =>
  storyboardOf([
    { type: 'sys_enter', pid: 2, nr: 1, name: 'write', args: [1, 0x10000, count], data: bytes('x'.repeat(count)) },
    { type: 'sys_exit', pid: 2, nr: 1, name: 'write', ret },
  ])

function sceneOf(storyboard: SyscallStoryboard, step: string) {
  const scene = storyboard.stages.find((s) => s.key === step)?.scene
  if (!scene) {
    throw new Error(`no ${step} stage`)
  }
  return scene
}

describe('syscallReturnText', () => {
  it('prints what the program gets back, or errno on a failure', () => {
    expect(syscallReturnText(write(3, 3))).toBe('→ 3')
    expect(syscallReturnText(write(3, -9))).toBe('→ -1, errno = EBADF')
  })
})

describe('slipLines', () => {
  it('keeps every line of a write within the slip', () => {
    const lines = slipLines(write(65536, 65536))
    expect(lines).toEqual(['fd 1', '65536 bytes'])
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(SLIP_CHARS)
    }
  })
})

describe('syscallDrawingText', () => {
  it('names the program and its PID in the title', () => {
    const storyboard = write(3, 3)
    expect(syscallDrawingText(storyboard, sceneOf(storyboard, 'answer')).title).toBe('hello · PID 2')
  })
})

describe('syscallDrawingLayout', () => {
  it('makes room for the kernel copy only when the write gets that far', () => {
    const ok = write(3, 3)
    const badFd = write(3, -9)
    const okLayout = syscallDrawingLayout(ok, sceneOf(ok, 'answer'), 'simple')
    const badLayout = syscallDrawingLayout(badFd, sceneOf(badFd, 'answer'), 'simple')
    expect(okLayout.kernelBuffer).toBe(true)
    expect(badLayout.kernelBuffer).toBe(false)
    expect(okLayout.height - badLayout.height).toBe(KERNEL_BUFFER_HEIGHT)
  })

  it('points at the buffer while the registers load, and at the Gate while crossing', () => {
    const storyboard = write(3, 3)
    expect(syscallDrawingLayout(storyboard, sceneOf(storyboard, 'registers'), 'simple').pointerY).toBe(
      SYSCALL_USER_BUFFER_Y + CELL_HEIGHT / 2
    )
    expect(syscallDrawingLayout(storyboard, sceneOf(storyboard, 'gate'), 'simple').pointerY).toBe(SYSCALL_LINE_Y)
  })

  it('is taller at Deep, where the call path and pt_regs are drawn', () => {
    const storyboard = write(3, 3)
    const scene = sceneOf(storyboard, 'answer')
    const simple = syscallDrawingLayout(storyboard, scene, 'simple')
    const deep = syscallDrawingLayout(storyboard, scene, 'deep')
    expect(deep.height).toBeGreaterThan(simple.height)
    expect(deep.kernelBufferY).toBeGreaterThan(SYSCALL_KERNEL_TOP)
  })

  it('loads eax with the syscall number and pt_regs->ax with the answer', () => {
    const storyboard = write(3, 3)
    const layout = syscallDrawingLayout(storyboard, sceneOf(storyboard, 'answer'), 'deep')
    expect(layout.registers.find((r) => r.label === 'eax')?.value).toBe('1')
    expect(layout.ptRegs.find((r) => r.label === 'ax')?.value).toBe('3')
    expect(layout.slot).toBe('1')
  })
})
