// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMachineSetup } from '#hooks/vm/useMachineSetup.hook'
import { useTraceStore } from '#store/trace.store'
import { useVmStore } from '#store/vm.store'

const setupVmLevel = vi.fn(async (_key: string, _lines: readonly string[], onStart?: () => void) => {
  onStart?.()
  return true
})
vi.mock('#services/vm/vm-connection.service', () => ({
  setupVmLevel: (key: string, lines: readonly string[], onStart?: () => void) => setupVmLevel(key, lines, onStart),
}))

afterEach(() => {
  useVmStore.getState().reset()
  useTraceStore.getState().reset()
  setupVmLevel.mockClear()
})

describe('useMachineSetup', () => {
  it("sets the level up once Linux is ready, and clears the last level's runs from X-ray", () => {
    useTraceStore.getState().record([], { commandLine: 'ls /', status: 0 })
    renderHook(() => useMachineSetup({ cwd: '/tmp' }, 'level-a'))
    expect(setupVmLevel).not.toHaveBeenCalled()

    act(() => useVmStore.getState().setStatus({ phase: 'ready', detail: null }))

    expect(setupVmLevel).toHaveBeenCalledOnce()
    expect(setupVmLevel.mock.calls[0]?.[0]).toBe('level-a')
    // The session file goes in base64, as the setup script writes every file.
    expect(setupVmLevel.mock.calls[0]?.[1].join('\n')).toContain(btoa("cd '/tmp'\n"))
    expect(useTraceStore.getState().runs).toEqual([])
  })
})
