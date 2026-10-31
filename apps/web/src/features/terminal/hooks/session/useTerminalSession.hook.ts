import { vmStatusLine } from '@features/terminal/utils/vm'
import { openTerminal } from '@features/terminal/utils/xterm'
import { useLinuxTerminal, useReveal } from '@kernelfall/machine/hooks'
import type { Terminal } from '@xterm/xterm'
import { type RefObject, useEffect, useRef } from 'react'
import '@xterm/xterm/css/xterm.css'

/** The terminal on the real Linux VM's console: keys go to bash, its output comes back as bytes. */
export function useTerminalSession(container: RefObject<HTMLDivElement | null>, locked = false): void {
  const terminal = useRef<Terminal | null>(null)
  const isLocked = useRef(locked)
  isLocked.current = locked
  // What arrives before the terminal opens (console bytes, the first status line) is shown once it does.
  const early = useRef<(Uint8Array | string)[]>([])
  const show = (data: Uint8Array | string) => {
    if (terminal.current) {
      terminal.current.write(data)
    } else {
      early.current.push(data)
    }
  }
  const { reveal } = useReveal()
  const { phase, detail, send } = useLinuxTerminal(show)

  // biome-ignore lint/correctness/useExhaustiveDependencies: show only reads refs.
  useEffect(() => {
    const line = vmStatusLine(phase, detail)
    if (line !== null) {
      show(line)
    }
  }, [phase, detail])

  useEffect(() => {
    if (terminal.current) {
      terminal.current.options.disableStdin = locked
    }
  }, [locked])

  useEffect(() => {
    const element = container.current
    if (!element) {
      return
    }
    const opened = openTerminal(element, { onReveal: reveal, convertEol: false })
    for (const data of early.current) {
      opened.terminal.write(data)
    }
    early.current = []
    opened.terminal.options.disableStdin = isLocked.current
    // Keys typed while the Machine starts would land in a shell that is about to be replaced.
    const typing = opened.terminal.onData((data) => {
      if (!isLocked.current) {
        send(data)
      }
    })
    terminal.current = opened.terminal
    return () => {
      typing.dispose()
      terminal.current = null
      opened.dispose()
    }
  }, [container, reveal, send])
}
