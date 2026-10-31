// @vitest-environment jsdom
import { toXrayCalls } from '@features/xray/utils/calls'
import { syscallStoryboard } from '@features/xray/utils/syscalls'
import { xrayContent } from '@kernelfall/levels/utils'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { bytes, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { SyscallDrawing } from './SyscallDrawing'

/** What fits on the request slip: 124px wide less 10px each side, at 7px a character. */
const SLIP_CHARS = 14

function storyboardOfWrite(count: number) {
  const text = 'x'.repeat(count)
  const events = stamp([
    { type: 'sys_enter', pid: 2, nr: 1, name: 'write', args: [1, 0x10000, count], data: bytes(text) },
    { type: 'sys_exit', pid: 2, nr: 1, name: 'write', ret: count },
  ])
  const content = xrayContent()
  const [call] = toXrayCalls(runOf(events, './hello'), events, content)
  if (!call) {
    throw new Error('no call')
  }
  return syscallStoryboard(call, content.narration)
}

/** The request slip's text lines, at the stage where the registers are loaded. */
function slipLines(count: number): readonly string[] {
  const storyboard = storyboardOfWrite(count)
  const scene = storyboard.stages.find((s) => s.key === 'answer')?.scene
  if (!scene) {
    throw new Error('no answer stage')
  }
  const { container } = render(<SyscallDrawing storyboard={storyboard} scene={scene} depth="simple" label="Fig. 1" />)
  const slip = [...container.querySelectorAll('.xr-ttl')].find((t) => t.textContent === 'Request slip')?.parentElement
  return [...(slip?.querySelectorAll('text.xr-m') ?? [])].map((t) => t.textContent ?? '')
}

describe('SyscallDrawing', () => {
  it.each([15, 1024, 65536])('fits every line of the request slip for a %i-byte write', (count) => {
    const lines = slipLines(count)
    expect(lines).toContain(`${count} bytes`)
    for (const line of lines.filter((l) => !l.startsWith('CPU'))) {
      expect(line.length, line).toBeLessThanOrEqual(SLIP_CHARS)
    }
  })
})
