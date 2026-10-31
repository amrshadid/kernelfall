import { useContent } from '@features/content/hooks/content'
import { useLevelActions } from '@kernelfall/game/hooks'
import type { LevelId } from '@kernelfall/game/types'
import { loadReferenceFiles } from '@kernelfall/levels/utils'
import { useMachineFiles, useTerminalCommand } from '@kernelfall/machine/hooks'
import { defaultRunCommand } from '@shared/utils/workspace'
import { useCallback } from 'react'

const C_SOURCE = '.c'

/** Runs init's code like Run would, so "Watch it" has a real run to show; the player's own is kept. */
export function useReferenceRun(levelId: LevelId): () => Promise<void> {
  const { useReference: continueWithReference } = useLevelActions()
  const { writeFiles } = useMachineFiles()
  const terminal = useTerminalCommand()
  const content = useContent()

  return useCallback(async () => {
    // Without the files (an offline chunk miss), the level still goes on: never a dead end.
    const files = await loadReferenceFiles(levelId).catch(() => null)
    const step = await continueWithReference(files ?? undefined)
    if (!files || !step.success || !step.data?.changed) {
      return
    }
    const paths = Object.keys(files)
    // Without a running VM there is nothing to run; the editor sends the files once Linux is up.
    const written = await writeFiles({ ...content.starters.get(levelId), ...files }).catch(() => false)
    if (!written) {
      return
    }
    // The first C file of the reference is the program the run starts with.
    terminal.run(defaultRunCommand(paths, paths.find((path) => path.endsWith(C_SOURCE)) ?? ''))
  }, [levelId, continueWithReference, writeFiles, terminal, content])
}
