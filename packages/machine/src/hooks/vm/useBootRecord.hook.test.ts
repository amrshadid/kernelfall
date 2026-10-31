// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useBootRecord } from '#hooks/vm/useBootRecord.hook'
import { useVmStore } from '#store/vm.store'
import { BOOT_REPORT } from '#test/boot-report'
import { parseBootReport } from '#utils/boot/boot-report.util'

afterEach(() => useVmStore.getState().reset())

describe('useBootRecord', () => {
  it("is null until the guest has answered, then the Machine's boot", () => {
    const { result } = renderHook(() => useBootRecord())
    expect(result.current).toBeNull()
    const facts = parseBootReport(BOOT_REPORT)
    act(() => useVmStore.getState().setFacts(facts))
    expect(result.current?.summary.kernel).toBe('6.18.59-0-virt')
    expect(result.current?.log).toHaveLength(15)
  })
})
