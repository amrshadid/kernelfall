// @vitest-environment jsdom
import type { XrayChoice, XrayControlState, XrayLens } from '@features/xray/types'
import type { RunEvent } from '@kernelfall/machine/hooks'
import type { BootRecord, TraceRun } from '@kernelfall/machine/types'
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { machineBoot } from '@/test/fixtures/boot-record.fixture'
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

  it("draws the Machine's boot without a command, and waits for it until Linux has reported", () => {
    const input = (boot: BootRecord | null): XrayBoardInput => ({
      runs: [runOf(ECHO, 'echo hello')],
      run: runOf(ECHO, 'echo hello'),
      events: ECHO,
      lenses: [{ id: 'boot', label: 'Boot' }],
      state: controls('boot'),
      animate: false,
      scope: { levelId: 'board-boot', step: 'see-it' },
      cpus: 1,
      boot,
    })
    const waiting = renderHook(() => useXrayBoard(input(null))).result.current
    expect(waiting.figure).toBeNull()
    expect(waiting.emptyText).toContain('still starting')
    const shown = renderHook(() => useXrayBoard(input(machineBoot()))).result.current
    expect(shown.figure?.kind).toBe('boot')
    expect(shown.caption).toBe('Fig. 6. How this Machine booted, from its own kernel log (Linux 6.18.59-0-virt).')
    expect(shown.emptyText).toBeNull()
    expect(shown.controls.runs).toEqual([])
    expect(shown.playback.stages).toEqual([])
  })

  it('lists the calls by process and starts on the lesson, the shell closed when it teaches nothing', () => {
    const events = stamp(FORK_EXEC_WAIT)
    const run = runOf(events, 'echo hi')
    const input: XrayBoardInput = {
      runs: [run],
      run,
      events,
      lenses: LENSES,
      state: controls('syscalls'),
      animate: false,
      scope: { levelId: 'board-focus', step: 'see-it' },
      cpus: 1,
      focus: [{ names: ['execve', 'exit_group'] }],
    }
    const shown = renderHook(() => useXrayBoard(input)).result.current
    expect(shown.controls.callList?.groups.map((g) => [g.title, g.open])).toEqual([
      ['the shell (bash, PID 2)', false],
      ['the program (echo, PID 3)', true],
    ])
    expect(shown.figure?.kind === 'syscalls' && shown.figure.storyboard.call.name).toBe('execve')
  })

  it('has no call list outside the Syscalls view', () => {
    const events = stamp(FORK_EXEC_WAIT)
    expect(board('processes', runOf(events, 'echo hi'), events).controls.callList).toBeNull()
  })
})
