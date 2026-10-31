// @vitest-environment jsdom
import type { FileContents } from '@features/editor/types'
import { DRAFT_SAVE_DELAY_MS } from '@features/editor/utils/workspace'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDraftAutosave } from './useDraftAutosave.hook'

function autosave(contents: FileContents, onDraftsChange = vi.fn()) {
  const hook = renderHook(({ files }) => useDraftAutosave(files, onDraftsChange), {
    initialProps: { files: contents },
  })
  return { ...hook, onDraftsChange }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDraftAutosave', () => {
  it('saves the latest files once typing pauses', () => {
    const { result, rerender, onDraftsChange } = autosave({ 'a.c': '1' })
    act(() => result.current.scheduleSave())
    rerender({ files: { 'a.c': '12' } })
    act(() => result.current.scheduleSave())
    act(() => vi.advanceTimersByTime(DRAFT_SAVE_DELAY_MS - 1))
    expect(onDraftsChange).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onDraftsChange).toHaveBeenCalledExactlyOnceWith({ 'a.c': '12' })
  })

  it('saves a pending change at once, and nothing when none is pending', () => {
    const { result, onDraftsChange } = autosave({ 'a.c': '1' })
    act(() => result.current.saveNow())
    expect(onDraftsChange).not.toHaveBeenCalled()
    act(() => result.current.scheduleSave())
    act(() => result.current.saveNow())
    expect(onDraftsChange).toHaveBeenCalledOnce()
  })

  it('drops a cancelled save', () => {
    const { result, onDraftsChange } = autosave({ 'a.c': '1' })
    act(() => result.current.scheduleSave())
    act(() => result.current.cancelSave())
    act(() => vi.advanceTimersByTime(DRAFT_SAVE_DELAY_MS))
    expect(onDraftsChange).not.toHaveBeenCalled()
  })

  it('flushes a pending save when the editor closes', () => {
    const { result, unmount, onDraftsChange } = autosave({ 'a.c': '1' })
    act(() => result.current.scheduleSave())
    unmount()
    expect(onDraftsChange).toHaveBeenCalledExactlyOnceWith({ 'a.c': '1' })
  })
})
