// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMachineReboot } from '#hooks/vm/useMachineReboot.hook'

const rebootVm = vi.hoisted(() => vi.fn(async () => true))

vi.mock('#services/vm/vm-connection.service', () => ({ rebootVm }))

describe('useMachineReboot', () => {
  it('restarts the running Machine, through a stable action', async () => {
    const { result, rerender } = renderHook(() => useMachineReboot())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
    expect(await result.current.reboot()).toBe(true)
    expect(rebootVm).toHaveBeenCalledOnce()
  })
})
