// @vitest-environment jsdom
import type { EditorFile, EditorHandlers, RevealRequest } from '@features/editor/types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type CodeEditorOptions, useCodeEditor } from './useCodeEditor.hook'

const engine = vi.hoisted(() => ({
  handle: {
    showFile: vi.fn(),
    format: vi.fn(),
    reveal: vi.fn(),
    destroy: vi.fn(),
  },
  handlers: null as EditorHandlers | null,
}))

vi.mock('@features/editor/utils/codemirror', () => ({
  mountEditor: (_parent: HTMLElement, handlers: EditorHandlers) => {
    engine.handlers = handlers
    return engine.handle
  },
}))

const A: EditorFile = { path: 'a.c', content: 'int a;' }

function handlers(): EditorHandlers {
  return { onChange: vi.fn(), onRun: vi.fn(), onSave: vi.fn(), onFormatted: vi.fn() }
}

async function mounted(options: Partial<CodeEditorOptions> = {}) {
  const container = { current: document.createElement('div') }
  const initialProps: CodeEditorOptions = { file: A, reveal: null, handlers: handlers(), ...options }
  const hook = renderHook((props: CodeEditorOptions) => useCodeEditor(container, props), { initialProps })
  await waitFor(() => expect(hook.result.current.loaded).toBe(true))
  return hook
}

beforeEach(() => {
  for (const fn of Object.values(engine.handle)) {
    fn.mockClear()
  }
})

describe('useCodeEditor', () => {
  it('loads CodeMirror on mount and shows the file', async () => {
    await mounted()
    expect(engine.handle.showFile).toHaveBeenCalledWith(A)
  })

  it('jumps to a revealed place once per request, in the shown file only', async () => {
    const reveal: RevealRequest = { id: 1, path: 'a.c', line: 3, column: 2 }
    const { rerender, result } = await mounted({ reveal })
    expect(engine.handle.reveal).toHaveBeenCalledWith(3, 2)
    rerender({ file: A, reveal: { ...reveal }, handlers: handlers() })
    expect(engine.handle.reveal).toHaveBeenCalledTimes(1)
    rerender({ file: A, reveal: { ...reveal, id: 2, path: 'b.c' }, handlers: handlers() })
    expect(engine.handle.reveal).toHaveBeenCalledTimes(1)
    act(() => result.current.format())
    expect(engine.handle.format).toHaveBeenCalled()
  })

  it('calls the latest handlers without rebuilding the editor', async () => {
    const { rerender } = await mounted()
    const next = handlers()
    rerender({ file: A, reveal: null, handlers: next })
    engine.handlers?.onRun()
    expect(next.onRun).toHaveBeenCalled()
  })

  it('destroys the editor on unmount', async () => {
    const { unmount } = await mounted()
    unmount()
    expect(engine.handle.destroy).toHaveBeenCalled()
  })

  it("says it failed when CodeMirror's chunk can't be fetched", async () => {
    vi.resetModules()
    vi.doMock('@features/editor/utils/codemirror', () => {
      throw new Error('offline')
    })
    const { useCodeEditor: useFreshCodeEditor } = await import('./useCodeEditor.hook')
    const container = { current: document.createElement('div') }
    const { result } = renderHook(() => useFreshCodeEditor(container, { file: A, reveal: null, handlers: handlers() }))
    await waitFor(() => expect(result.current.failed).toBe(true))
    expect(result.current.loaded).toBe(false)
    vi.doUnmock('@features/editor/utils/codemirror')
  })
})
