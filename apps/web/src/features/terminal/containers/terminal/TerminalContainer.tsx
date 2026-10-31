import { TerminalPresentation } from '@features/terminal/components/terminal'
import { useTerminalSession } from '@features/terminal/hooks/session'
import { useMachineStatus } from '@kernelfall/machine/hooks'
import { useMachineLock } from '@shared/hooks/machine'
import { useRef } from 'react'

export function TerminalContainer() {
  const container = useRef<HTMLDivElement>(null)
  const lock = useMachineLock(useMachineStatus())
  const frozen = lock !== null && !lock.typing ? lock : null
  // A level setup holds keys for its new shell, so they are sent, not dropped.
  useTerminalSession(container, frozen !== null && !frozen.holdsKeys)
  return <TerminalPresentation ref={container} lock={frozen} />
}
