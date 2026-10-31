// @vitest-environment jsdom

import type { EditorHandle, EditorHandlers } from '@features/editor/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountEditor } from './editor-engine.util'

const formatter = vi.hoisted(() => ({ formatC: vi.fn(async (source: string) => source) }))

vi.mock('@features/editor/utils/format', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@features/editor/utils/format')>()),
  formatC: formatter.formatC,
}))

let parent: HTMLElement
let handlers: EditorHandlers
let editor: EditorHandle

/** The text CodeMirror shows: one `.cm-line` per line. */
const shown = () => [...parent.querySelectorAll('.cm-line')].map((line) => line.textContent).join('\n')

beforeEach(() => {
  // jsdom has no layout; CodeMirror measures text with these.
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => new DOMRect()
  parent = document.createElement('div')
  document.body.append(parent)
  handlers = { onChange: vi.fn(), onRun: vi.fn(), onSave: vi.fn(), onFormatted: vi.fn() }
  editor = mountEditor(parent, handlers)
})

afterEach(() => {
  editor.destroy()
  parent.remove()
})

describe('mountEditor', () => {
  it('shows a file without reporting it as an edit', () => {
    editor.showFile({ path: 'a.c', content: 'int a;' })
    expect(shown()).toBe('int a;')
    expect(handlers.onChange).not.toHaveBeenCalled()
  })

  it('applies a change made outside the editor as an edit', () => {
    editor.showFile({ path: 'a.c', content: 'int a;' })
    editor.showFile({ path: 'a.c', content: 'int b;' })
    expect(shown()).toBe('int b;')
    expect(handlers.onChange).toHaveBeenCalledWith('a.c', 'int b;')
  })

  it('keeps each file as it was across tab switches', () => {
    editor.showFile({ path: 'a.c', content: 'int a;' })
    editor.showFile({ path: 'b.c', content: 'int b;' })
    editor.showFile({ path: 'a.c', content: 'int a;' })
    expect(shown()).toBe('int a;')
  })

  it('refuses to format a file that is not C', async () => {
    editor.showFile({ path: 'Makefile', content: 'all:' })
    editor.format()
    await vi.waitFor(() =>
      expect(handlers.onFormatted).toHaveBeenCalledWith('Only C files you can edit are formatted.')
    )
  })

  it('formats C as one edit and reports success', async () => {
    formatter.formatC.mockResolvedValueOnce('int a;\n')
    editor.showFile({ path: 'a.c', content: 'int  a;' })
    editor.format()
    await vi.waitFor(() => expect(handlers.onFormatted).toHaveBeenCalledWith(null))
    expect(handlers.onChange).toHaveBeenLastCalledWith('a.c', 'int a;\n')
  })

  it("says so when clang-format can't load, and leaves the code alone", async () => {
    formatter.formatC.mockRejectedValueOnce(new Error('offline'))
    editor.showFile({ path: 'a.c', content: 'int  a;' })
    editor.format()
    await vi.waitFor(() => expect(handlers.onFormatted).toHaveBeenCalledWith(expect.stringMatching(/didn't load/)))
    expect(shown()).toBe('int  a;')
  })

  it('moves to a place without failing past the end', () => {
    editor.showFile({ path: 'a.c', content: 'int a;\nint b;' })
    expect(() => editor.reveal(99, 99)).not.toThrow()
  })
})
