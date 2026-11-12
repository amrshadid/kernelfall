// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTerminalSize } from '#hooks/vm/useTerminalSize.hook'

const resizeVmTerminal = vi.hoisted(() => vi.fn())

vi.mock('#services/vm/vm-connection.service', () => ({ resizeVmTerminal }))

describe('useTerminalSize', () => {
  it("passes the terminal's size to the Machine, through a stable action", () => {
    const { result, rerender } = renderHook(() => useTerminalSize())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
    result.current.resize(37, 80)
    expect(resizeVmTerminal).toHaveBeenCalledWith(37, 80)
  })
})
