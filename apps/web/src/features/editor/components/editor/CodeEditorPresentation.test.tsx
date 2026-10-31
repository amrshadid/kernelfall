// @vitest-environment jsdom
import type { RunState } from '@features/editor/types'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeEditorPresentation, type CodeEditorPresentationProps } from './CodeEditorPresentation'

vi.mock('@features/editor/hooks/codemirror', () => ({
  useCodeEditor: () => ({ loaded: true, failed: false, format: () => {} }),
}))

afterEach(cleanup)

function editor(run: RunState, onRun = vi.fn()) {
  const props: CodeEditorPresentationProps = {
    files: [{ path: 'a.c', content: '' }],
    activePath: 'a.c',
    modified: new Set(),
    reveal: null,
    run,
    status: null,
    onSelectFile: () => {},
    onChange: () => {},
    onRun,
    onSave: () => {},
    canFormat: true,
    onFormatted: () => {},
    onReset: () => {},
    onRestoreMine: null,
  }
  render(<CodeEditorPresentation {...props} />)
  return onRun
}

describe('CodeEditorPresentation', () => {
  it('keeps Run focusable but off while the Machine starts, and says why', () => {
    const reason = 'Booting Linux. Run works once Linux is running.'
    const onRun = editor({ kind: 'busy', label: 'Starting Linux…', reason })
    const run = screen.getByRole('button', { name: /Starting Linux/ })
    expect(run.getAttribute('aria-disabled')).toBe('true')
    expect(run.getAttribute('title')).toBe(reason)
    expect(run.hasAttribute('disabled')).toBe(false)
    expect(screen.getByText(reason).id).toBe(run.getAttribute('aria-describedby'))
    fireEvent.click(run)
    expect(onRun).not.toHaveBeenCalled()
  })

  it('runs once the Machine is ready', () => {
    const onRun = editor({ kind: 'idle' })
    const run = screen.getByRole('button', { name: /^Run/ })
    expect(run.hasAttribute('aria-disabled')).toBe(false)
    fireEvent.click(run)
    expect(onRun).toHaveBeenCalledTimes(1)
  })
})
