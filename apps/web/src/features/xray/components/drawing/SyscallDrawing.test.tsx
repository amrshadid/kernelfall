// @vitest-environment jsdom
import { toXrayCalls } from '@features/xray/utils/calls'
import { syscallStoryboard } from '@features/xray/utils/syscalls'
import { xrayContent } from '@kernelfall/levels/utils'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ECHO, runOf } from '@/test/fixtures/trace-events.fixture'
import { SyscallDrawing } from './SyscallDrawing'

const content = xrayContent()

function drawnAt(step: string) {
  const [call] = toXrayCalls(runOf(ECHO, 'echo hello'), ECHO, content)
  if (!call) {
    throw new Error('no call')
  }
  const storyboard = syscallStoryboard(call, content.narration)
  const scene = storyboard.stages.find((s) => s.key === step)?.scene
  if (!scene) {
    throw new Error(`no ${step} stage`)
  }
  const { container } = render(<SyscallDrawing storyboard={storyboard} scene={scene} label="Fig. 1" />)
  return container
}

const titles = (container: HTMLElement) => [...container.querySelectorAll('.xr-ttl')].map((t) => t.textContent)

describe('SyscallDrawing', () => {
  it("draws Deep's layers: the registers, the call path and pt_regs", () => {
    const container = drawnAt('answer')
    expect(titles(container)).toEqual(expect.arrayContaining(['CPU registers', 'Call path', 'struct pt_regs']))
    const path = [...container.querySelectorAll('text.xr-m')].map((t) => t.textContent)
    expect(path).toContain('→ n_tty_write')
  })

  it("draws none of Simple's old boxes: Simple shows the crossing instead", () => {
    const shown = titles(drawnAt('answer'))
    expect(shown).not.toContain('Request slip')
    expect(shown).not.toContain('In the kernel now')
  })
})
