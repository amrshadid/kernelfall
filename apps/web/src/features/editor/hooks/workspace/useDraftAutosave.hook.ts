import type { FileContents } from '@features/editor/types'
import { DRAFT_SAVE_DELAY_MS } from '@features/editor/utils/workspace'
import { useCallback, useEffect, useRef } from 'react'

export interface UseDraftAutosaveResult {
  /** Saves a pending change at once (Mod+S, blur, Run). */
  readonly saveNow: () => void
  /** Saves shortly after the last call, so typing is saved once it pauses. */
  readonly scheduleSave: () => void
  /** Drops a pending save, when the files were saved elsewhere. */
  readonly cancelSave: () => void
}

/** A pending save is flushed when the editor closes, so no keystroke is lost. */
export function useDraftAutosave(
  contents: FileContents,
  onDraftsChange: ((files: FileContents) => void) | undefined
): UseDraftAutosaveResult {
  const onSave = useRef(onDraftsChange)
  onSave.current = onDraftsChange
  const latest = useRef(contents)
  latest.current = contents
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelSave = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const saveNow = useCallback(() => {
    if (timer.current !== null) {
      cancelSave()
      onSave.current?.(latest.current)
    }
  }, [cancelSave])

  const scheduleSave = useCallback(() => {
    cancelSave()
    timer.current = setTimeout(() => {
      timer.current = null
      onSave.current?.(latest.current)
    }, DRAFT_SAVE_DELAY_MS)
  }, [cancelSave])

  useEffect(() => saveNow, [saveNow])

  return { saveNow, scheduleSave, cancelSave }
}
