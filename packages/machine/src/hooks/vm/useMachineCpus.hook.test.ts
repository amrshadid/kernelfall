// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useMachineCpus } from '#hooks/vm/useMachineCpus.hook'
import { useVmStore } from '#store/vm.store'

afterEach(() => useVmStore.getState().reset())

describe('useMachineCpus', () => {
  it("is v86's one CPU until the guest answers, then the guest's own count", () => {
    const { result } = renderHook(() => useMachineCpus())
    expect(result.current).toBe(1)
    act(() => useVmStore.getState().setFacts({ cpus: 2, boot: null }))
    expect(result.current).toBe(2)
  })
})
