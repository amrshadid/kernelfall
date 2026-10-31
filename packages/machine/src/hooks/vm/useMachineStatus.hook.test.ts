// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useMachineStatus } from '#hooks/vm/useMachineStatus.hook'
import { useVmStore } from '#store/vm.store'

afterEach(() => useVmStore.getState().reset())

describe('useMachineStatus', () => {
  it("follows the VM's phase and why it failed", () => {
    const { result } = renderHook(() => useMachineStatus())
    expect(result.current).toEqual({ phase: 'off', detail: null })
    act(() => useVmStore.getState().setStatus({ phase: 'failed', detail: 'No Linux image at /vm/' }))
    expect(result.current).toEqual({ phase: 'failed', detail: 'No Linux image at /vm/' })
  })
})
