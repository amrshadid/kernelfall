// @vitest-environment jsdom
import type { SourceLocation } from '@kernelfall/machine/types'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type EditorWorkspaceOptions, useEditorWorkspace } from './useEditorWorkspace.hook'

const machine = vi.hoisted(() => ({
  writeFiles: vi.fn(async (_files: Record<string, string>) => true),
  run: vi.fn((_commandLine: string) => {}),
  status: { phase: 'ready', detail: null as string | null },
  reveal: null as ((location: SourceLocation) => void) | null,
}))

vi.mock('@kernelfall/machine/hooks', () => ({
  useMachineFiles: () => ({ writeFiles: machine.writeFiles }),
  useTerminalCommand: () => ({ run: machine.run }),
  useMachineStatus: () => machine.status,
  useRevealRequests: (listener: (location: SourceLocation) => void) => {
    machine.reveal = listener
  },
}))

const STARTER = { 'a.c': 'int a;', Makefile: 'all:' }

function workspace(options: Partial<EditorWorkspaceOptions> = {}) {
  return renderHook(() => useEditorWorkspace({ starter: STARTER, ...options }))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  machine.status = { phase: 'ready', detail: null }
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useEditorWorkspace', () => {
  it('opens the starter and writes it into the VM once Linux is ready', () => {
    const { result } = workspace()
    expect(result.current.files.map((file) => file.path)).toEqual(['a.c', 'Makefile'])
    expect(result.current.activePath).toBe('a.c')
    expect(machine.writeFiles).toHaveBeenCalledWith(STARTER)
  })

  it('waits for Linux before writing, and says it is starting', () => {
    machine.status = { phase: 'booting', detail: null }
    const { result } = workspace()
    expect(machine.writeFiles).not.toHaveBeenCalled()
    expect(result.current.run).toEqual({
      kind: 'busy',
      label: 'Starting Linux…',
      reason: 'Booting Linux. Run works once Linux is running.',
    })
  })

  it.each(['loading', 'booting', 'restoring', 'failed'] as const)(
    'keeps Run and its shortcut off while %s',
    (phase) => {
      machine.status = { phase, detail: null }
      const { result } = workspace()
      expect(result.current.run.kind).toBe('busy')
      act(() => result.current.onRun())
      act(() => vi.runAllTimers())
      expect(machine.run).not.toHaveBeenCalled()
    }
  )

  it('says why Run is off when the Machine failed', () => {
    machine.status = { phase: 'failed', detail: 'no wasm' }
    const { result } = workspace()
    expect(result.current.run).toEqual({
      kind: 'busy',
      label: 'Run',
      reason: 'Run needs a running Machine. Reload the page to try again.',
    })
    expect(result.current.status).toBe('no wasm')
  })

  it("starts from the player's drafts and marks what differs from the starter", () => {
    const { result } = workspace({ drafts: { 'a.c': 'int b;' } })
    expect(result.current.files[0]?.content).toBe('int b;')
    expect([...result.current.modified]).toEqual(['a.c'])
  })

  it('saves drafts a moment after editing stops, or at once on save', () => {
    const onDraftsChange = vi.fn()
    const { result } = workspace({ onDraftsChange })
    act(() => result.current.onChange('a.c', 'int c;'))
    expect(onDraftsChange).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1000))
    expect(onDraftsChange).toHaveBeenLastCalledWith({ ...STARTER, 'a.c': 'int c;' })
    act(() => result.current.onChange('a.c', 'int d;'))
    act(() => result.current.onSave())
    expect(onDraftsChange).toHaveBeenLastCalledWith({ ...STARTER, 'a.c': 'int d;' })
  })

  it('sends only the changed file, once typing pauses', () => {
    const { result } = workspace()
    machine.writeFiles.mockClear()
    act(() => result.current.onChange('a.c', 'int b'))
    act(() => result.current.onChange('a.c', 'int b;'))
    expect(machine.writeFiles).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(300))
    expect(machine.writeFiles).toHaveBeenCalledTimes(1)
    expect(machine.writeFiles).toHaveBeenCalledWith({ 'a.c': 'int b;' })
  })

  it('writes pending edits, then types make into the terminal when there is a Makefile', async () => {
    const { result } = workspace()
    act(() => result.current.onChange('a.c', 'int b;'))
    await act(async () => result.current.onRun())
    expect(machine.writeFiles).toHaveBeenLastCalledWith({ 'a.c': 'int b;' })
    expect(machine.run).toHaveBeenCalledWith('make')
  })

  it('still runs, and sends every file again later, when a write fails', async () => {
    const { result } = workspace()
    machine.writeFiles.mockRejectedValueOnce(new Error('worker gone'))
    act(() => result.current.onChange('a.c', 'int b;'))
    await act(async () => result.current.onRun())
    expect(machine.run).toHaveBeenCalledWith('make')
    act(() => result.current.onChange('a.c', 'int c;'))
    await act(async () => result.current.onRun())
    expect(machine.writeFiles).toHaveBeenLastCalledWith({ ...STARTER, 'a.c': 'int c;' })
  })

  it('sends every file again to a VM that restarted', () => {
    const { rerender } = workspace()
    machine.writeFiles.mockClear()
    machine.status = { phase: 'booting', detail: null }
    rerender()
    machine.status = { phase: 'ready', detail: null }
    rerender()
    expect(machine.writeFiles).toHaveBeenCalledWith(STARTER)
  })

  it('resets every file to the starter', () => {
    const { result } = workspace({ drafts: { 'a.c': 'int b;' } })
    act(() => result.current.onReset())
    expect(result.current.files[0]?.content).toBe('int a;')
  })

  it('opens a file the terminal links to, and ignores files it does not have', () => {
    const { result } = workspace()
    act(() => machine.reveal?.({ file: './Makefile', line: 1, column: 1 }))
    expect(result.current.activePath).toBe('Makefile')
    expect(result.current.reveal).toMatchObject({ path: 'Makefile', line: 1 })
    act(() => machine.reveal?.({ file: 'missing.c', line: 1, column: 1 }))
    expect(result.current.activePath).toBe('Makefile')
  })

  it('swaps in replaced code once per replacement', () => {
    const { result, rerender } = renderHook((props: EditorWorkspaceOptions) => useEditorWorkspace(props), {
      initialProps: { starter: STARTER, replacement: null } as EditorWorkspaceOptions,
    })
    rerender({ starter: STARTER, replacement: { id: 1, files: { 'a.c': 'int r;' } } })
    expect(result.current.files[0]?.content).toBe('int r;')
  })

  it('formats only editable C files', () => {
    expect(workspace().result.current.canFormat).toBe(true)
    expect(workspace({ readOnly: ['a.c'] }).result.current.canFormat).toBe(false)
  })
})
