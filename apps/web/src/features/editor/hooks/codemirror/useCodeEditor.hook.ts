import type { EditorFile, EditorHandle, EditorHandlers, RevealRequest } from '@features/editor/types'
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface CodeEditorOptions {
  readonly file: EditorFile | undefined
  readonly reveal: RevealRequest | null
  readonly handlers: EditorHandlers
}

export interface CodeEditor {
  readonly loaded: boolean
  /** CodeMirror's chunk couldn't be fetched (offline after a new deploy). */
  readonly failed: boolean
  readonly format: () => void
}

/** CodeMirror is imported on mount, so it stays out of the first-load bundle. */
export function useCodeEditor(
  container: RefObject<HTMLDivElement | null>,
  { file, reveal, handlers }: CodeEditorOptions
): CodeEditor {
  const [editor, setEditor] = useState<EditorHandle | null>(null)
  const [failed, setFailed] = useState(false)
  const latest = useRef(handlers)
  latest.current = handlers

  useEffect(() => {
    const element = container.current
    if (!element) {
      return
    }
    let handle: EditorHandle | null = null
    let cancelled = false
    import('@features/editor/utils/codemirror').then(
      ({ mountEditor }) => {
        if (cancelled) {
          return
        }
        handle = mountEditor(element, {
          onChange: (path, content) => latest.current.onChange(path, content),
          onRun: () => latest.current.onRun(),
          onSave: () => latest.current.onSave(),
          onFormatted: (problem) => latest.current.onFormatted(problem),
        })
        setEditor(handle)
      },
      () => {
        if (!cancelled) {
          setFailed(true)
        }
      }
    )
    return () => {
      cancelled = true
      handle?.destroy()
      setEditor(null)
    }
  }, [container])

  useEffect(() => {
    if (editor && file) {
      editor.showFile(file)
    }
  }, [editor, file])

  const path = file?.path
  const revealId = reveal?.id
  // biome-ignore lint/correctness/useExhaustiveDependencies: a request is handled once, by id.
  useEffect(() => {
    if (editor && reveal && reveal.path === path) {
      editor.reveal(reveal.line, reveal.column)
    }
  }, [editor, revealId, path])

  const format = useCallback(() => editor?.format(), [editor])

  return useMemo(() => ({ loaded: editor !== null, failed, format }), [editor, failed, format])
}
