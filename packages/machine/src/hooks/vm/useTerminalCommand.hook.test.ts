// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTerminalCommand } from '#hooks/vm/useTerminalCommand.hook'

const sendToVm = vi.hoisted(() => vi.fn())

vi.mock('#services/vm/vm-connection.service', () => ({ sendToVm }))

describe('useTerminalCommand', () => {
  it('types the command line and presses Enter, as the player would', () => {
    const { result } = renderHook(() => useTerminalCommand())
    result.current.run('gcc -Wall hello.c -o hello && ./hello')
    expect(sendToVm).toHaveBeenCalledWith('gcc -Wall hello.c -o hello && ./hello\n')
  })
})
