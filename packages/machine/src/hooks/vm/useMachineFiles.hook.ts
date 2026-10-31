import { useMemo } from 'react'
import { writeVmFiles } from '#services/vm/vm-connection.service'

export interface UseMachineFilesResult {
  /** Puts files in the shell's home directory, so gcc and make see them; false while no VM runs. */
  readonly writeFiles: (files: Readonly<Record<string, string>>) => Promise<boolean>
}

/** The editor's files, shared with the Linux VM. */
export function useMachineFiles(): UseMachineFilesResult {
  return useMemo(() => ({ writeFiles: writeVmFiles }), [])
}
