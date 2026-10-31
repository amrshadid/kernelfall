// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCodexTab } from './useCodexTab.hook'

describe('useCodexTab', () => {
  it('starts on the cards and switches to the Field Guide', () => {
    const { result } = renderHook(() => useCodexTab(null, true))
    expect(result.current.tab).toBe('cards')
    act(() => result.current.setTab('field-guide'))
    expect(result.current.tab).toBe('field-guide')
  })

  it('shows the cards again when a card link is followed', () => {
    const { result, rerender } = renderHook(({ card }) => useCodexTab(card, true), {
      initialProps: { card: null as string | null },
    })
    act(() => result.current.setTab('field-guide'))
    rerender({ card: 'write-syscall' })
    expect(result.current.tab).toBe('cards')
  })

  it('keeps to the cards while the Field Guide is not open yet', () => {
    const { result } = renderHook(() => useCodexTab(null, false))
    act(() => result.current.setTab('field-guide'))
    expect(result.current.tab).toBe('cards')
  })
})
