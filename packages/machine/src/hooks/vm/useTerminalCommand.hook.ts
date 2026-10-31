import { useMemo } from 'react'
import { sendToVm } from '#services/vm/vm-connection.service'

export interface UseTerminalCommandResult {
  /** Types a command line into the terminal and presses Enter, as the player would. */
  readonly run: (commandLine: string) => void
}

/** Runs a command line in the VM's terminal, for Run buttons and the Guide's command chips. */
export function useTerminalCommand(): UseTerminalCommandResult {
  return useMemo(() => ({ run: (commandLine: string) => sendToVm(`${commandLine}\n`) }), [])
}
