import type { FileContents } from '@features/editor/types'
import { changedFiles, VM_SYNC_DELAY_MS } from '@features/editor/utils/workspace'
import { useCallback, useEffect, useRef } from 'react'

export interface UseVmFileSyncResult {
  /** Sends pending edits now; resolves once the VM has them (Run waits for it). */
  readonly flush: () => Promise<void>
}

/** Typing sends only the changed files, once it pauses, so the worker isn't sent every file per keystroke. */
export function useVmFileSync(
  contents: FileContents,
  ready: boolean,
  writeFiles: (files: FileContents) => Promise<boolean>
): UseVmFileSyncResult {
  const latest = useRef(contents)
  latest.current = contents
  // What the running VM has; null for a VM that has nothing of ours yet.
  const synced = useRef<FileContents | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback(async () => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
    const changed = changedFiles(synced.current, latest.current)
    if (!changed) {
      return
    }
    synced.current = { ...synced.current, ...changed }
    const written = await writeFiles(changed).catch(() => false)
    if (!written) {
      synced.current = null
    }
  }, [writeFiles])

  // biome-ignore lint/correctness/useExhaustiveDependencies: each edit restarts the pause; flush reads the latest contents.
  useEffect(() => {
    if (!ready) {
      // A VM that starts again has none of the files.
      synced.current = null
      return
    }
    if (synced.current === null) {
      void flush()
      return
    }
    timer.current = setTimeout(() => void flush(), VM_SYNC_DELAY_MS)
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [ready, contents, flush])

  return { flush }
}
