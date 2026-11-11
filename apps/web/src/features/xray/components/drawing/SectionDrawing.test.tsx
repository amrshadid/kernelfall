// @vitest-environment jsdom
import { sectionOf } from '@features/xray/utils/section'
import type { TraceCall, TraceRun } from '@kernelfall/machine/types'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SectionDrawing } from './SectionDrawing'

function call(id: number, name: string): TraceCall {
  return { id, pid: 2, nr: 0, name, args: [], result: { kind: 'returned', ret: 0 } }
}

const CAT: TraceRun = {
  id: 1,
  commandLine: 'cat /etc/motd\n',
  status: 0,
  pid: 2,
  exitCode: 0,
  calls: [call(1, 'openat'), call(2, 'read'), call(3, 'write')],
}

const lit = (container: HTMLElement) =>
  [...container.querySelectorAll('.xr-section__part--lit .xr-section__name')].map((part) => part.textContent)

describe('SectionDrawing', () => {
  it('hangs dark before any command, with the Gate named', () => {
    const { container } = render(<SectionDrawing view={sectionOf(null)} commandLine="" />)
    expect(lit(container)).toEqual([])
    expect(container.querySelector('.xr-section__program')?.textContent).toBe('No command has run yet.')
    expect(container.querySelector('.xr-section__gate')?.textContent).toContain('The Gate')
  })

  it('draws the command above the Gate, counts its requests and lights the parts it reached', () => {
    const { container } = render(<SectionDrawing view={sectionOf(CAT)} commandLine={CAT.commandLine} />)
    expect(container.querySelector('.xr-section__program')?.textContent).toBe('$ cat /etc/motd')
    expect(container.querySelector('.xr-section__gate-count')?.textContent).toBe('3 requests crossed')
    expect(lit(container)).toEqual(['VFS and filesystems', 'CPUs'])
  })

  it('draws the syscall interface as the Gate, not as a part', () => {
    const { container } = render(<SectionDrawing view={sectionOf(CAT)} commandLine={CAT.commandLine} />)
    const names = [...container.querySelectorAll('.xr-section__name')].map((part) => part.textContent)
    expect(names).not.toContain('Syscall interface')
    expect(names).not.toContain('Programs')
  })
})
