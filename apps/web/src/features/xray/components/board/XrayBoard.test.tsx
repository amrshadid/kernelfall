// @vitest-environment jsdom
import { useXrayBoard } from '@features/xray/hooks/board'
import type { XrayControlState } from '@features/xray/types'
import { cleanup, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ECHO, runOf } from '@/test/fixtures/trace-events.fixture'
import { XrayBoard } from './XrayBoard'

afterEach(cleanup)
// jsdom has no layout; the strace log scrolls its focused line into view.
Element.prototype.scrollIntoView = vi.fn()

const state: XrayControlState = {
  lens: 'syscalls',
  depth: 'simple',
  predict: false,
  runId: null,
  pick: null,
  expanded: false,
  setLens: vi.fn(),
  setDepth: vi.fn(),
  setPredict: vi.fn(),
  selectRun: vi.fn(),
  select: vi.fn(),
  setExpanded: vi.fn(),
}

function boardOf(depth: XrayControlState['depth']) {
  const run = runOf(ECHO, 'echo hello')
  return renderHook(() =>
    useXrayBoard({
      runs: [run],
      run,
      events: ECHO,
      lenses: [{ id: 'syscalls', label: 'Syscalls' }],
      state: { ...state, depth },
      animate: false,
      scope: { levelId: `board-test-${depth}`, step: 'see-it' },
      cpus: 1,
    })
  ).result.current
}

describe('XrayBoard', () => {
  it('fits a crossing to the dock: one call listed, the beat sentence under the drawing', () => {
    const { container } = render(<XrayBoard layout="dock" {...boardOf('simple')} animate={false} />)
    expect(container.querySelector('.xr--fit')).not.toBeNull()
    expect(container.querySelector('.xr-calls-shell')).not.toBeNull()
    const beat = container.querySelector('.xr__beat')
    expect(beat?.getAttribute('aria-live')).toBe('polite')
    expect(beat?.textContent).toContain('asks the kernel')
    // The sentence sits before the playback controls, and the long narration is not repeated.
    expect(beat?.nextElementSibling?.classList.contains('xr__transport')).toBe(true)
    expect(container.querySelector('.xr__narr-title')).toBeNull()
  })

  it('keeps the full-size sheet and Deep as they were', () => {
    const sheet = render(<XrayBoard layout="sheet" {...boardOf('simple')} animate={false} />).container
    expect(sheet.querySelector('.xr--fit')).toBeNull()
    expect(sheet.querySelector('.xr__narr-title')).not.toBeNull()
    cleanup()
    const deep = render(<XrayBoard layout="dock" {...boardOf('deep')} animate={false} />).container
    expect(deep.querySelector('.xr--fit')).toBeNull()
    expect(deep.querySelector('.xr__beat')).toBeNull()
    expect(deep.querySelector('.xr-calls-shell')).toBeNull()
  })
})
