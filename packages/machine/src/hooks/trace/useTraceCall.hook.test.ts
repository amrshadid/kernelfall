// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useTraceCall } from '#hooks/trace/useTraceCall.hook'
import { useTraceStore } from '#store/trace.store'
import { HELLO_RUN, stamp } from '#test/trace-events'

describe('useTraceCall', () => {
  afterEach(() => useTraceStore.getState().reset())

  it('explains a call by id: its strace line, card and outcome', () => {
    act(() => useTraceStore.getState().record(stamp(HELLO_RUN), { commandLine: './hello', status: 0 }))
    const { result } = renderHook(() => useTraceCall(0))

    expect(result.current?.call.name).toBe('write')
    expect(result.current?.straceLine).toBe(`${'write(1, "hi\\n", 3) '.padEnd(40)}= 3`)
    expect(result.current?.info.source.path).toBe('fs/read_write.c')
    expect(result.current?.outcome).toBe('Returned 3 to the program.')
  })

  it('is undefined for no id or a call that is gone', () => {
    expect(renderHook(() => useTraceCall(null)).result.current).toBeUndefined()
    expect(renderHook(() => useTraceCall(5)).result.current).toBeUndefined()
  })
})
