// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useLinuxTerminal } from '#hooks/vm/useLinuxTerminal.hook'
import { useVmStore } from '#store/vm.store'
import type { VmStatus } from '#types/definitions/vm'

const vm = vi.hoisted(() => ({
  onStatus: null as ((status: VmStatus) => void) | null,
  output: new Set<(bytes: Uint8Array) => void>(),
  stopped: true,
  sent: [] as string[],
}))

vi.mock('#services/vm/vm-connection.service', () => ({
  connectVm: (onStatus: (status: VmStatus) => void) => {
    vm.onStatus = onStatus
    return { started: true }
  },
  disconnectVm: () => ({ stopped: vm.stopped }),
  onVmOutput: (listener: (bytes: Uint8Array) => void) => {
    vm.output.add(listener)
    return () => vm.output.delete(listener)
  },
  sendToVm: (text: string) => vm.sent.push(text),
}))

afterEach(() => {
  useVmStore.getState().reset()
  vm.output.clear()
  vm.sent = []
  vm.stopped = true
})

describe('useLinuxTerminal', () => {
  it("starts the VM, follows its phase, and hands every console byte to the caller's latest callback", () => {
    const first = vi.fn()
    const latest = vi.fn()
    const { result, rerender } = renderHook(({ onOutput }) => useLinuxTerminal(onOutput), {
      initialProps: { onOutput: first },
    })
    expect(result.current.phase).toBe('off')
    act(() => vm.onStatus?.({ phase: 'ready', detail: null }))
    expect(result.current.phase).toBe('ready')

    rerender({ onOutput: latest })
    const bytes = new TextEncoder().encode('kernelfall:~# ')
    for (const listener of vm.output) {
      listener(bytes)
    }
    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledWith(bytes)
  })

  it('sends keys to the VM as typed', () => {
    const { result } = renderHook(() => useLinuxTerminal(() => {}))
    result.current.send('ls\r')
    expect(vm.sent).toEqual(['ls\r'])
  })

  it('stops following the output on unmount, and forgets the phase when the last user stopped the VM', () => {
    const { unmount } = renderHook(() => useLinuxTerminal(() => {}))
    act(() => vm.onStatus?.({ phase: 'ready', detail: null }))
    unmount()
    expect(vm.output.size).toBe(0)
    expect(useVmStore.getState().status.phase).toBe('off')
  })

  it('keeps the phase while another user still runs the VM', () => {
    vm.stopped = false
    const { unmount } = renderHook(() => useLinuxTerminal(() => {}))
    act(() => vm.onStatus?.({ phase: 'ready', detail: null }))
    unmount()
    expect(useVmStore.getState().status.phase).toBe('ready')
  })
})
