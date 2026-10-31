import { sourceLinks } from '@features/terminal/utils/links'
import type { SourceLocation } from '@kernelfall/machine/types'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { FONT_SIZE_PX, LINE_HEIGHT, SCROLLBACK_LINES } from './terminal.constants'
import { followTheme } from './terminal-theme.util'

export interface OpenTerminalOptions {
  /** A clicked `file:line` in the output. */
  readonly onReveal: (location: SourceLocation) => void
  /** False for a real tty, which turns "\n" into "\r\n" itself (ONLCR); true by default. */
  readonly convertEol?: boolean
}

export interface OpenTerminal {
  readonly terminal: Terminal
  /** Stops following the page's size and theme, and closes the terminal. */
  readonly dispose: () => void
}

/** An xterm.js terminal in `element` that fills it, follows the page's theme and links source locations. */
export function openTerminal(element: HTMLElement, { onReveal, convertEol = true }: OpenTerminalOptions): OpenTerminal {
  const terminal = new Terminal({
    cursorBlink: true,
    // Turns "\n" into "\r\n", the job of the tty's ONLCR output flag.
    convertEol,
    fontFamily: getComputedStyle(element).fontFamily,
    fontSize: FONT_SIZE_PX,
    lineHeight: LINE_HEIGHT,
    scrollback: SCROLLBACK_LINES,
  })
  const fit = new FitAddon()
  terminal.loadAddon(fit)
  terminal.open(element)
  fit.fit()
  const resize = new ResizeObserver(() => fit.fit())
  resize.observe(element)
  const unfollowTheme = followTheme(terminal, element)
  const links = terminal.registerLinkProvider(sourceLinks(terminal, onReveal))

  return {
    terminal,
    dispose: () => {
      links.dispose()
      unfollowTheme()
      resize.disconnect()
      terminal.dispose()
    },
  }
}
