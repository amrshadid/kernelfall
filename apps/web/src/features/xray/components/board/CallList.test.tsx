// @vitest-environment jsdom
import type { CallListView, XrayCall } from '@features/xray/types'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CallList } from './CallList'

afterEach(cleanup)

const call = (id: number, name: string, text: string): XrayCall =>
  ({ id, name, text, outcome: { kind: 'returned', ret: 0, errno: null, toProgram: 0 } }) as XrayCall

const startUp = [call(2, 'brk', 'brk(0)'), call(3, 'mprotect', 'mprotect(0x1000, 4096, 1)')]

const view = (open: boolean, live = false): CallListView => ({
  live,
  groups: [
    {
      key: 'pid:3',
      pid: 3,
      role: 'program',
      title: 'the program (echo, PID 3)',
      facts: ['forked by PID 2', 'execve /bin/echo', 'exit 0'],
      count: 4,
      focused: true,
      focusedCalls: [],
      open: !live,
      rows: live
        ? []
        : [
            { kind: 'call', call: call(1, 'execve', 'execve("/bin/echo", 0x2000, 0x3000)'), focused: true },
            {
              kind: 'fold',
              key: 'start-up:2',
              fold: 'start-up',
              label: 'start-up',
              calls: startUp,
              focused: false,
              open,
              shown: open ? startUp : [],
              hidden: 0,
            },
            { kind: 'call', call: call(4, 'write', 'write(1, "hi\\n", 3)'), focused: true },
          ],
    },
  ],
})

describe('CallList', () => {
  it('draws a process as a group with its facts, and a fold as a row with a count', () => {
    render(<CallList view={view(false)} selectedId={4} onSelect={vi.fn()} onToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: /the program \(echo, PID 3\)/ }).getAttribute('aria-expanded')).toBe(
      'true'
    )
    expect(screen.getByText('forked by PID 2 · execve /bin/echo · exit 0')).toBeTruthy()
    const fold = screen.getByRole('button', { name: /start-up/ })
    expect(fold.getAttribute('aria-expanded')).toBe('false')
    expect(fold.textContent).toContain('2 calls')
    expect(screen.getByRole('button', { name: /^write/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByRole('button', { name: /^brk/ })).toBeNull()
  })

  it('selects a call and toggles a fold by key', () => {
    const onSelect = vi.fn()
    const onToggle = vi.fn()
    render(<CallList view={view(true)} selectedId={null} onSelect={onSelect} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: /^brk/ }))
    fireEvent.click(screen.getByRole('button', { name: /start-up/ }))
    expect(onSelect).toHaveBeenCalledWith(2)
    expect(onToggle).toHaveBeenCalledWith('start-up:2')
  })

  it('moves between rows with the arrow keys', () => {
    render(<CallList view={view(false)} selectedId={null} onSelect={vi.fn()} onToggle={vi.fn()} />)
    const head = screen.getByRole('button', { name: /the program/ })
    head.focus()
    fireEvent.keyDown(head, { key: 'ArrowDown' })
    expect(document.activeElement?.textContent).toContain('execve')
  })

  it('shows only counts while the command runs', () => {
    render(<CallList view={view(false, true)} selectedId={null} onSelect={vi.fn()} onToggle={vi.fn()} />)
    expect(screen.getByText(/4 calls so far/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^execve/ })).toBeNull()
  })
})
