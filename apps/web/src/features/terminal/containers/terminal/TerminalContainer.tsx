import { TerminalPresentation } from '@features/terminal/components/terminal'
import { useTerminalSession } from '@features/terminal/hooks/session'
import { useRef } from 'react'

export function TerminalContainer() {
  const container = useRef<HTMLDivElement>(null)
  useTerminalSession(container)
  return <TerminalPresentation ref={container} />
}
