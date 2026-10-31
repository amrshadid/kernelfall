// @vitest-environment jsdom
import type { SourceLocation } from '@kernelfall/machine/types'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEditorReveal } from './useEditorReveal.hook'

const machine = vi.hoisted(() => ({ reveal: null as ((location: SourceLocation) => void) | null }))

vi.mock('@kernelfall/machine/hooks', () => ({
  useRevealRequests: (listener: (location: SourceLocation) => void) => {
    machine.reveal = listener
  },
}))

describe('useEditorReveal', () => {
  it("opens a clicked file:line from gcc's ./path and counts each request", () => {
    const open = vi.fn()
    const { result } = renderHook(() => useEditorReveal({ 'a.c': '' }, open))
    act(() => machine.reveal?.({ file: './a.c', line: 3, column: 5 }))
    expect(open).toHaveBeenCalledWith('a.c')
    expect(result.current).toEqual({ id: 1, path: 'a.c', line: 3, column: 5 })
    act(() => machine.reveal?.({ file: 'a.c', line: 4, column: 1 }))
    expect(result.current?.id).toBe(2)
  })

  it('ignores files the editor does not have', () => {
    const open = vi.fn()
    const { result } = renderHook(() => useEditorReveal({ 'a.c': '' }, open))
    act(() => machine.reveal?.({ file: '/usr/include/stdio.h', line: 1, column: 1 }))
    expect(open).not.toHaveBeenCalled()
    expect(result.current).toBeNull()
  })
})
