// @vitest-environment jsdom
import type { RunEvent } from '@kernelfall/machine/hooks'
import type { TraceRun } from '@kernelfall/machine/types'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { liveRedrawMs, useLiveRun } from './useLiveRun.hook'

const runOf = (id: number, running: boolean): TraceRun => ({
  id,
  commandLine: 'find /',
  status: 0,
  pid: 7,
  calls: [],
  exitCode: null,
  ...(running && { running }),
})
const eventsOf = (n: number) =>
  Array.from({ length: n }, (_, seq) => ({ type: 'sched_process_free', pid: 7, seq, time: 0 }) as RunEvent)

describe('useLiveRun', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('redraws a big live run less often, and shows the finished run at once', () => {
    const big = eventsOf(50_000)
    const { result, rerender } = renderHook(({ run, events }) => useLiveRun(run, events), {
      initialProps: { run: runOf(1, true), events: eventsOf(10) },
    })
    expect(result.current.events).toHaveLength(10)

    rerender({ run: runOf(1, true), events: big })
    expect(result.current.events).toHaveLength(10)
    act(() => {
      vi.advanceTimersByTime(liveRedrawMs(big.length))
    })
    expect(result.current.events).toBe(big)

    const done = runOf(1, false)
    rerender({ run: done, events: big })
    expect(result.current.run).toBe(done)
  })

  it('keeps a small live run current', () => {
    expect(liveRedrawMs(200)).toBeLessThanOrEqual(4)
    expect(liveRedrawMs(1_000_000)).toBe(2000)
  })

  it('shows a new run at once', () => {
    const { result, rerender } = renderHook(({ run, events }) => useLiveRun(run, events), {
      initialProps: { run: runOf(1, true), events: eventsOf(50_000) },
    })
    const next = runOf(2, true)
    rerender({ run: next, events: eventsOf(3) })
    expect(result.current.run).toBe(next)
  })
})
