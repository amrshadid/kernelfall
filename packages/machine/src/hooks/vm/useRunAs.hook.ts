import { useMemo } from 'react'
import { runVmCommandAs } from '#services/vm/vm-connection.service'

export interface UseRunAsResult {
  /**
   * Runs `commandLine` as `user` on the Machine (S.2's guest at the door), traced like the player's
   * commands: its events reach the checkers. Resolves with its exit status, or null with no Machine.
   * Call it while the player's shell waits at its prompt.
   */
  readonly runAs: (user: string, commandLine: string) => Promise<number | null>
}

/** Another user's command, for a level's story beat. */
export function useRunAs(): UseRunAsResult {
  return useMemo(() => ({ runAs: runVmCommandAs }), [])
}
