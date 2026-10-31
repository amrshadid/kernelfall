import { useCodeEditor } from '@features/editor/hooks/codemirror'
import type { EditorFile, RevealRequest, RunState } from '@features/editor/types'
import { ariaKeyShortcut, FORMAT_BINDING, RUN_BINDING, shortcutLabel } from '@shared/utils/keyboard'
import { useRef, useState } from 'react'
import { FileTabs } from './FileTabs'

export interface CodeEditorPresentationProps {
  files: readonly EditorFile[]
  activePath: string
  /** Paths whose content differs from the starter (shown with a mark on the tab). */
  modified: ReadonlySet<string>
  /** Open a file at a line (a clicked `file:line` in the terminal). */
  reveal: RevealRequest | null
  run: RunState
  /** A short line: a Format problem, or where Linux is while it starts; null when there is nothing to say. */
  status: string | null
  onSelectFile: (path: string) => void
  onChange: (path: string, content: string) => void
  /** Run button and Mod+Enter. */
  onRun: () => void
  /** Mod+S and leaving the editor: a moment to save drafts now. */
  onSave: () => void
  /** Whether the open file can be formatted (an editable C file). */
  canFormat: boolean
  /** After Format: null when it worked, else a short notice. */
  onFormatted: (problem: string | null) => void
  /** After the player confirms. */
  onReset: () => void
  /** Brings back the player's own code after init's version was loaded; null when there is none. */
  onRestoreMine: (() => void) | null
}

const RUN_SHORTCUT = shortcutLabel(RUN_BINDING)
const FORMAT_SHORTCUT = shortcutLabel(FORMAT_BINDING)

const BUTTON =
  'inline-flex min-h-8 shrink-0 items-center gap-2 border-2 px-3 text-sm font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:border-dashed disabled:border-[var(--ink-2,#55554f)] disabled:bg-[var(--sheet,#fafaf7)] disabled:text-[var(--ink-2,#55554f)]'

export function CodeEditorPresentation(props: CodeEditorPresentationProps) {
  const { files, activePath, run, status } = props
  const surface = useRef<HTMLDivElement>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const file = files.find((f) => f.path === activePath) ?? files[0]
  const { loaded, failed, format } = useCodeEditor(surface, {
    file,
    reveal: props.reveal,
    handlers: {
      onChange: props.onChange,
      onRun: props.onRun,
      onSave: props.onSave,
      onFormatted: props.onFormatted,
    },
  })

  const reset = () => {
    setConfirmingReset(false)
    props.onReset()
  }

  return (
    <section
      aria-label="Code editor"
      className="@container flex h-full min-h-64 flex-col bg-[var(--sheet,#fafaf7)] text-[var(--ink,#141414)]"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          props.onSave()
        }
      }}
    >
      <div className="flex min-h-11 items-stretch border-b-2 border-[var(--ink,#141414)]">
        <FileTabs
          files={files}
          activePath={file?.path ?? activePath}
          modified={props.modified}
          onSelect={props.onSelectFile}
        />
        <div className="ml-auto flex min-w-0 items-center gap-2 px-2">
          <span role="status" aria-live="polite" className="min-w-0 truncate text-xs text-[var(--ink-2,#55554f)]">
            {status}
          </span>
          {props.onRestoreMine && (
            <button
              type="button"
              className={`${BUTTON} border-transparent hover:border-[var(--ink,#141414)]`}
              onClick={props.onRestoreMine}
            >
              <span className="@3xl:hidden">Restore mine</span>
              <span className="hidden @3xl:inline">Restore my code</span>
            </button>
          )}
          {confirmingReset ? (
            <>
              <span className="text-sm">Reset every file to the starter?</span>
              <button type="button" className={`${BUTTON} border-[var(--ink,#141414)]`} onClick={reset}>
                Reset
              </button>
              <button
                type="button"
                className={`${BUTTON} border-transparent`}
                onClick={() => setConfirmingReset(false)}
              >
                Keep my code
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`${BUTTON} border-transparent hover:border-[var(--ink,#141414)]`}
              onClick={() => setConfirmingReset(true)}
            >
              {/* A narrow editor (the 1024px layout) keeps Run on screen with shorter labels. */}
              <span className="@3xl:hidden">Reset</span>
              <span className="hidden @3xl:inline">Reset to starter</span>
            </button>
          )}
          <button
            type="button"
            className={`${BUTTON} border-[var(--ink,#141414)] hover:bg-[var(--ink,#141414)] hover:text-[var(--sheet,#fafaf7)]`}
            aria-keyshortcuts={ariaKeyShortcut(FORMAT_BINDING)}
            disabled={!loaded || !props.canFormat}
            onClick={format}
          >
            Format
            <kbd className="hidden text-xs font-medium @3xl:inline">{FORMAT_SHORTCUT}</kbd>
          </button>
          <button
            type="button"
            className={`${BUTTON} border-[var(--red,#c8201a)] bg-[var(--red,#c8201a)] text-[var(--on-red,#fafaf7)] hover:border-[var(--ink,#141414)] hover:bg-[var(--ink,#141414)]`}
            aria-keyshortcuts={ariaKeyShortcut(RUN_BINDING)}
            disabled={run.kind === 'busy'}
            onClick={props.onRun}
          >
            {run.kind === 'busy' ? run.label : 'Run'}
            <kbd className="hidden text-xs font-medium @xl:inline">{RUN_SHORTCUT}</kbd>
          </button>
        </div>
      </div>
      <div ref={surface} className="relative min-h-0 flex-1 overflow-hidden">
        {!loaded && (
          <p className="p-4 text-sm text-[var(--ink-2,#55554f)]">
            {failed ? "The editor didn't load. Check your connection and reload the page." : 'Loading the editor…'}
          </p>
        )}
      </div>
    </section>
  )
}
