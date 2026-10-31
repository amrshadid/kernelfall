// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useRunEvents } from '#hooks/trace/useRunEvents.hook'
import { useTraceStore } from '#store/trace.store'
import { HELLO_RUN, stamp } from '#test/trace-events'

const EVENTS = stamp(HELLO_RUN)

describe('useRunEvents', () => {
  afterEach(() => useTraceStore.getState().reset())

  it("returns a run's events, including those its syscall list leaves out", () => {
    act(() => useTraceStore.getState().record(EVENTS, { commandLine: './hello', status: 0 }))
    const { result } = renderHook(() => useRunEvents(1))
    expect(result.current).toBe(EVENTS)
  })

  it('is empty for no id and for a run that is gone, with the same array each time', () => {
    const none = renderHook(() => useRunEvents(null)).result.current
    const gone = renderHook(() => useRunEvents(42)).result.current
    expect(none).toEqual([])
    expect(gone).toBe(none)
  })
})
