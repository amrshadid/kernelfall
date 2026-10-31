// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTerminalSession } from './useTerminalSession.hook'

/** What the fake terminal was asked to show, the player's keyboard, and the fake VM. */
const screen = vi.hoisted(() => ({ text: '', type: (_data: string) => {} }))
const vm = vi.hoisted(() => ({
  sent: [] as string[],
  output: (_bytes: Uint8Array) => {},
  status: { phase: 'off', detail: null as string | null },
  early: null as Uint8Array | null,
}))

vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    options = {}
    loadAddon() {}
    open() {}
    registerLinkProvider() {
      return { dispose() {} }
    }
    onData(listener: (data: string) => void) {
      screen.type = listener
      return { dispose() {} }
    }
    write(data: string | Uint8Array) {
      screen.text += typeof data === 'string' ? data : new TextDecoder().decode(data)
    }
    dispose() {}
  },
}))
vi.mock('@xterm/addon-fit', () => ({
  FitAddon: class {
    fit() {}
  },
}))
vi.mock('@xterm/xterm/css/xterm.css', () => ({}))
vi.mock('@kernelfall/machine/hooks', () => {
  const actions = { reveal() {} }
  const send = (text: string) => vm.sent.push(text)
  return {
    useReveal: () => actions,
    useLinuxTerminal(onOutput: (bytes: Uint8Array) => void) {
      vm.output = onOutput
      // Bytes the VM had already sent when the hook first rendered, before the terminal opened.
      if (vm.early !== null) {
        onOutput(vm.early)
        vm.early = null
      }
      return { ...vm.status, send }
    },
  }
})

const encode = (text: string) => new TextEncoder().encode(text)

function open() {
  const container = { current: document.createElement('div') }
  return renderHook(() => useTerminalSession(container))
}

beforeEach(() => {
  screen.text = ''
  vm.sent = []
  vm.status = { phase: 'off', detail: null }
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  )
  vi.stubGlobal('matchMedia', () => ({ addEventListener() {}, removeEventListener() {} }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useTerminalSession', () => {
  it("shows the VM's console output and sends every key to bash, escape sequences and all", () => {
    open()
    act(() => vm.output(encode('kernelfall:~# ')))
    expect(screen.text).toBe('kernelfall:~# ')
    act(() => screen.type('ls\r'))
    act(() => screen.type('\x1b[A'))
    expect(vm.sent).toEqual(['ls\r', '\x1b[A'])
  })

  it('shows output in the order it arrived, across many chunks', () => {
    open()
    act(() => {
      for (const chunk of ['a', 'b', 'c\r\n', 'd']) {
        vm.output(encode(chunk))
      }
    })
    expect(screen.text).toBe('abc\r\nd')
  })

  it('shows what arrived before the terminal opened first, then what comes after', () => {
    vm.early = encode('Welcome to Alpine\r\n')
    open()
    act(() => vm.output(encode('kernelfall:~$ ')))
    expect(screen.text).toBe('Welcome to Alpine\r\nkernelfall:~$ ')
  })

  it('sends Ctrl-C to bash as the byte it is, so the tty raises SIGINT', () => {
    open()
    act(() => screen.type('sleep 9\r'))
    act(() => screen.type('\x03'))
    expect(vm.sent).toEqual(['sleep 9\r', '\x03'])
  })

  it('shows the status line of a Machine that was already starting when the terminal opened', () => {
    vm.status = { phase: 'booting', detail: null }
    open()
    expect(screen.text).toContain('Booting Linux…')
  })

  it('drops every key while locked, and sends them again once unlocked', () => {
    const container = { current: document.createElement('div') }
    const { rerender } = renderHook(({ locked }) => useTerminalSession(container, locked), {
      initialProps: { locked: true },
    })
    act(() => screen.type('ls\r'))
    expect(vm.sent).toEqual([])
    rerender({ locked: false })
    act(() => screen.type('pwd\r'))
    expect(vm.sent).toEqual(['pwd\r'])
  })

  it('says what the Machine is doing while Linux starts', () => {
    const { rerender } = open()
    vm.status = { phase: 'booting', detail: null }
    rerender()
    expect(screen.text).toContain('Booting Linux…')
  })
})
