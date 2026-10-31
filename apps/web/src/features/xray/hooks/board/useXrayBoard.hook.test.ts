// @vitest-environment jsdom
import type { XrayChoice, XrayControlState, XrayLens } from '@features/xray/types'
import type { RunEvent } from '@kernelfall/machine/hooks'
import type { TraceRun } from '@kernelfall/machine/types'
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ECHO, FORK_EXEC_WAIT, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { useXrayBoard, type XrayBoardInput } from './useXrayBoard.hook'

const LENSES: readonly XrayChoice<XrayLens>[] = [
  { id: 'syscalls', label: 'Syscalls' },
  { id: 'processes', label: 'Processes' },
]

function controls(lens: XrayLens): XrayControlState {
  return {
    lens,
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
}

function board(lens: XrayLens, run: TraceRun | undefined, events: readonly RunEvent[]) {
  const input: XrayBoardInput = {
    runs: run ? [run] : [],
    run,
    events,
    lenses: LENSES,
    state: controls(lens),
    animate: false,
    scope: { levelId: `board-${lens}`, step: 'see-it' },
    cpus: 2,
  }
  return renderHook(() => useXrayBoard(input)).result.current
}

describe('useXrayBoard', () => {
  it('asks for a command before anything has run', () => {
    const empty = board('syscalls', undefined, [])
    expect(empty.figure).toBeNull()
    expect(empty.emptyText).toContain('Type a command in the terminal')
  })

  it("draws a command's first write, with its calls to pick from and the strace log", () => {
    const shown = board('syscalls', runOf(ECHO, 'echo hello'), ECHO)
    expect(shown.figure?.kind).toBe('syscalls')
    expect(shown.caption).toBe('Fig. 1. write(1, "hello\\n", 6), end to end.')
    expect(shown.controls.picks.map((pick) => pick.label)).toEqual(['write', 'exit_group'])
    expect(shown.controls.log?.lines).toHaveLength(3)
    expect(shown.playback.stages[0]?.tick).toBe('write()')
  })

  it("draws a fork's child in the Processes view", () => {
    const events = stamp(FORK_EXEC_WAIT)
    const shown = board('processes', runOf(events, './ksh-lite'), events)
    expect(shown.figure?.kind).toBe('processes')
    expect(shown.caption).toBe('Fig. 2. ksh-lite forks PID 3, which runs /bin/echo.')
    expect(shown.controls.pickLegend).toBe('Child')
  })

  it('says when a command never forked', () => {
    expect(board('processes', runOf(ECHO, 'echo hello'), ECHO).emptyText).toContain('never called `fork()`')
  })

  it('draws the whole run at once in the route and CPU views, with nothing to pick or play', () => {
    const events = stamp(FORK_EXEC_WAIT)
    const route = board('route', runOf(events, './ksh-lite'), events)
    expect(route.figure?.kind).toBe('route')
    expect(route.controls.picks).toEqual([])
    expect(route.playback.stages).toEqual([])
    const cpus = board('cpus', runOf(events, './ksh-lite'), events)
    expect(cpus.figure?.kind === 'cpus' && cpus.figure.view.lanes).toHaveLength(2)
  })
})
