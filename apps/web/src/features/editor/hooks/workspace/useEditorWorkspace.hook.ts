import type { CodeEditorPresentationProps } from '@features/editor/components/editor'
import type { EditorFile, FileContents, RunState } from '@features/editor/types'
import { isSourceFile } from '@features/editor/utils/workspace'
import { useMachineFiles, useMachineStatus, useTerminalCommand } from '@kernelfall/machine/hooks'
import { useMachineLock } from '@shared/hooks/machine'
import { defaultRunCommand } from '@shared/utils/workspace'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDraftAutosave } from './useDraftAutosave.hook'
import { useEditorReveal } from './useEditorReveal.hook'
import { useVmFileSync } from './useVmFileSync.hook'

const IDLE: RunState = { kind: 'idle' }

export interface EditorWorkspaceOptions {
  /** Reset restores these. */
  readonly starter: FileContents
  /** Start from these instead of the starter. */
  readonly drafts?: FileContents | undefined
  readonly readOnly?: readonly string[] | undefined
  /** Every file, about a second after editing stops, and on Mod+S or blur. */
  readonly onDraftsChange?: ((files: FileContents) => void) | undefined
  /** What Run types into the terminal; by default `make`, or build and run the open file. */
  readonly runCommand?: string | undefined
  /** Code swapped in from outside (init's version, or the player's restored); a new `id` applies it. */
  readonly replacement?: { readonly id: number; readonly files: FileContents } | null | undefined
  /** Shown as "Restore my code" while the player's own code is kept aside; null hides it. */
  readonly onRestoreMine?: (() => void) | null | undefined
}

/** The player's files live in the Linux VM's home directory too, so gcc and make see every edit. */
export function useEditorWorkspace(options: EditorWorkspaceOptions): CodeEditorPresentationProps {
  const { starter, readOnly, runCommand } = options
  const { writeFiles } = useMachineFiles()
  const terminal = useTerminalCommand()
  const machine = useMachineStatus()
  const [contents, setContents] = useState<FileContents>(() => ({ ...starter, ...options.drafts }))
  const [activePath, setActivePath] = useState(() => Object.keys(starter)[0] ?? '')
  const [notice, setNotice] = useState<string | null>(null)
  const { saveNow, scheduleSave, cancelSave } = useDraftAutosave(contents, options.onDraftsChange)
  const reveal = useEditorReveal(contents, setActivePath)
  const lock = useMachineLock(machine)
  const ready = machine.phase === 'ready'
  const { flush } = useVmFileSync(contents, ready, writeFiles)

  const replacement = options.replacement
  // biome-ignore lint/correctness/useExhaustiveDependencies: a replacement is applied once, by id.
  useEffect(() => {
    if (!replacement) {
      return
    }
    // The game already saved the swapped-in code; a pending save of the old text must not overwrite it.
    cancelSave()
    setContents({ ...starter, ...replacement.files })
  }, [replacement?.id])

  const files = useMemo<EditorFile[]>(
    () =>
      Object.entries(contents).map(([path, content]) => ({
        path,
        content,
        ...(readOnly?.includes(path) && { readOnly: true }),
      })),
    [contents, readOnly]
  )

  const modified = useMemo(
    () => new Set(Object.keys(contents).filter((path) => contents[path] !== starter[path])),
    [contents, starter]
  )

  const onChange = useCallback(
    (path: string, content: string) => {
      setContents((current) => (current[path] === content ? current : { ...current, [path]: content }))
      scheduleSave()
    },
    [scheduleSave]
  )

  const onRun = useCallback(() => {
    saveNow()
    // The shortcut reaches here even while the button is off.
    if (!ready) {
      return
    }
    setNotice(null)
    // The files reach the guest before the command does, so gcc builds what is on screen.
    void flush().then(() => terminal.run(runCommand ?? defaultRunCommand(Object.keys(contents), activePath)))
  }, [ready, flush, terminal, runCommand, contents, activePath, saveNow])

  const onReset = useCallback(() => {
    setContents({ ...starter })
    scheduleSave()
  }, [starter, scheduleSave])

  const onFormatted = useCallback((problem: string | null) => setNotice(problem), [])

  const active = files.find((file) => file.path === activePath)
  const canFormat = active !== undefined && isSourceFile(active.path) && !active.readOnly

  return {
    files,
    activePath,
    modified,
    reveal,
    run: lock ? { kind: 'busy', label: lock.failed ? 'Run' : 'Starting Linux…', reason: lock.runReason } : IDLE,
    status: notice ?? machine.detail,
    onSelectFile: setActivePath,
    onChange,
    onRun,
    onSave: saveNow,
    canFormat,
    onFormatted,
    onRestoreMine: options.onRestoreMine ?? null,
    onReset,
  }
}
