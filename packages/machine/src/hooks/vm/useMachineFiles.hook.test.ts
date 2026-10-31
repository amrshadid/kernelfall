// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMachineFiles } from '#hooks/vm/useMachineFiles.hook'

const writeVmFiles = vi.hoisted(() => vi.fn(async (_files: Readonly<Record<string, string>>) => true))

vi.mock('#services/vm/vm-connection.service', () => ({ writeVmFiles }))

describe('useMachineFiles', () => {
  it("writes the editor's files into the VM and reports whether one was running", async () => {
    const { result, rerender } = renderHook(() => useMachineFiles())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
    expect(await result.current.writeFiles({ 'hello.c': 'int main(void) { return 0; }\n' })).toBe(true)
    expect(writeVmFiles).toHaveBeenCalledWith({ 'hello.c': 'int main(void) { return 0; }\n' })
  })
})
