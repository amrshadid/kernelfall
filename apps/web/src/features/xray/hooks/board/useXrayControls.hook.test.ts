// @vitest-environment jsdom
import type { XrayChoice, XrayLens } from '@features/xray/types'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useXrayControls } from './useXrayControls.hook'

const BOTH: readonly XrayChoice<XrayLens>[] = [
  { id: 'syscalls', label: 'Syscalls' },
  { id: 'processes', label: 'Processes' },
]

function controls(levelId: string | null, latestRunId: number | undefined = 1) {
  return renderHook(({ run }) => useXrayControls(levelId, BOTH, run), { initialProps: { run: latestRunId } })
}

describe('useXrayControls', () => {
  it("opens on the level's first view", () => {
    expect(controls('controls-first').result.current.lens).toBe('syscalls')
  })

  it('remembers the view the player picked, per level', () => {
    const { result } = controls('controls-pick')
    act(() => result.current.setLens('processes'))
    expect(result.current.lens).toBe('processes')
    expect(controls('controls-pick').result.current.lens).toBe('processes')
    expect(controls('controls-other').result.current.lens).toBe('syscalls')
  })

  it('brings the panel to a new command, dropping what was picked', () => {
    const { result, rerender } = controls('controls-run')
    act(() => result.current.selectRun(7))
    act(() => result.current.select('42'))
    expect(result.current).toMatchObject({ runId: 7, pick: '42' })
    rerender({ run: 2 })
    expect(result.current).toMatchObject({ runId: null, pick: null })
  })

  it('opens and closes the full-size sheet', () => {
    const { result } = controls(null)
    act(() => result.current.setExpanded(true))
    expect(result.current.expanded).toBe(true)
  })
})
