// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useSyscallTrace } from '#hooks/trace/useSyscallTrace.hook'
import { useTraceStore } from '#store/trace.store'
import { HELLO_RUN, stamp } from '#test/trace-events'

describe('useSyscallTrace', () => {
  afterEach(() => useTraceStore.getState().reset())

  it('is empty before any command', () => {
    const { result } = renderHook(() => useSyscallTrace())
    expect(result.current).toMatchObject({ runs: [], latest: undefined, isEmpty: true })
  })

  it('shows recorded runs, most recent last, and clears them', () => {
    const { result } = renderHook(() => useSyscallTrace())
    act(() => {
      useTraceStore.getState().record(stamp(HELLO_RUN), { commandLine: './hello', status: 0 })
      useTraceStore.getState().record(stamp(HELLO_RUN, 100), { commandLine: './again', status: 0 })
    })
    expect(result.current.runs.map((run) => run.commandLine)).toEqual(['./hello', './again'])
    expect(result.current.latest?.commandLine).toBe('./again')
    expect(result.current.isEmpty).toBe(false)

    act(() => result.current.clear())
    expect(result.current.isEmpty).toBe(true)
  })
})
