// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openTerminal } from './open-terminal.util'
import { FONT_SIZE_PX, LINE_HEIGHT, SCROLLBACK_LINES } from './terminal.constants'

const xterm = vi.hoisted(() => ({
  options: null as Record<string, unknown> | null,
  calls: [] as string[],
}))

vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    options = {}
    constructor(options: Record<string, unknown>) {
      xterm.options = options
    }
    loadAddon() {}
    open() {
      xterm.calls.push('open')
    }
    registerLinkProvider() {
      return { dispose: () => xterm.calls.push('links') }
    }
    dispose() {
      xterm.calls.push('terminal')
    }
  },
}))
vi.mock('@xterm/addon-fit', () => ({
  FitAddon: class {
    fit() {
      xterm.calls.push('fit')
    }
  },
}))

beforeEach(() => {
  xterm.calls = []
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {
        xterm.calls.push('observe')
      }
      disconnect() {
        xterm.calls.push('disconnect')
      }
    }
  )
  vi.stubGlobal('matchMedia', () => ({ addEventListener() {}, removeEventListener() {} }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('openTerminal', () => {
  it("opens at Section 2's terminal type size, fitted to its element", () => {
    openTerminal(document.createElement('div'), { onReveal: () => {} })
    expect(xterm.options).toMatchObject({
      fontSize: FONT_SIZE_PX,
      lineHeight: LINE_HEIGHT,
      scrollback: SCROLLBACK_LINES,
      convertEol: true,
    })
    expect(xterm.calls).toEqual(['open', 'fit', 'observe'])
  })

  it('stops following its element and closes the terminal on dispose', () => {
    const { dispose } = openTerminal(document.createElement('div'), { onReveal: () => {} })
    xterm.calls = []
    dispose()
    expect(xterm.calls).toEqual(['links', 'disconnect', 'terminal'])
  })
})
