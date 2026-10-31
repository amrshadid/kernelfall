import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab, isolateHistory } from '@codemirror/commands'
import { cpp } from '@codemirror/lang-cpp'
import { bracketMatching, indentOnInput, indentUnit } from '@codemirror/language'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { EditorSelection, EditorState, type Extension, Prec } from '@codemirror/state'
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import type { EditorFile, EditorHandle, EditorHandlers } from '@features/editor/types'
import { formatC, formatEdit } from '@features/editor/utils/format'
import { isSourceFile } from '@features/editor/utils/workspace'
import { FORMAT_BINDING, isMacPlatform, matches } from '@shared/utils/keyboard'
import { section2Theme } from './section2-theme.constants'
import { wrapWithIndent } from './wrap-indent.util'

/** Kernel style: tabs, shown 8 wide (Documentation/process/coding-style.rst). */
const TAB_SIZE = 8

/** If the player types while clang-format runs, the result is dropped rather than overwrite their typing. */
async function formatView(view: EditorView, path: string, report: (problem: string | null) => void): Promise<void> {
  const state = view.state
  if (!isSourceFile(path) || state.readOnly) {
    report('Only C files you can edit are formatted.')
    return
  }
  const source = state.doc.toString()
  let formatted: string
  try {
    formatted = await formatC(source, path)
  } catch {
    report("Couldn't format: clang-format didn't load. Your code is unchanged.")
    return
  }
  if (view.state.doc !== state.doc) {
    report('The file changed while formatting. Format again.')
    return
  }
  const edit = formatEdit(source, formatted, view.state.selection.main.head)
  if (edit.change) {
    view.dispatch({
      changes: edit.change,
      selection: EditorSelection.cursor(edit.cursor),
      scrollIntoView: true,
      userEvent: 'format',
      // Its own undo step: typing right after must not merge into it.
      annotations: isolateHistory.of('full'),
    })
  }
  report(null)
}

/** Always handles the key, so nothing else sees it. */
const handled = (action: () => void) => (): boolean => {
  action()
  return true
}

function shortcuts(file: EditorFile, handlers: EditorHandlers): Extension {
  return Prec.highest([
    keymap.of([
      { key: 'Mod-Enter', run: handled(() => handlers.onRun()), preventDefault: true },
      // Players press Mod+S by habit; never let it open "Save page".
      { key: 'Mod-s', run: handled(() => handlers.onSave()), preventDefault: true },
    ]),
    // Format by key code: on macOS Option turns F into a symbol, which a keymap can't match.
    EditorView.domEventHandlers({
      keydown(event, view) {
        if (!matches(event, FORMAT_BINDING, isMacPlatform())) {
          return false
        }
        event.preventDefault()
        void formatView(view, file.path, (problem) => handlers.onFormatted(problem))
        return true
      },
    }),
  ])
}

function fileExtensions(file: EditorFile, handlers: EditorHandlers): Extension {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    history(),
    drawSelection(),
    highlightActiveLine(),
    bracketMatching(),
    closeBrackets(),
    indentOnInput(),
    highlightSelectionMatches(),
    shortcuts(file, handlers),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      // Escape, then Tab, leaves the editor, so Tab is no keyboard trap.
      indentWithTab,
    ]),
    isSourceFile(file.path) ? cpp() : [],
    indentUnit.of('\t'),
    EditorState.tabSize.of(TAB_SIZE),
    wrapWithIndent(),
    EditorState.readOnly.of(file.readOnly ?? false),
    EditorView.contentAttributes.of({ 'aria-label': `Editor, ${file.path}` }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        handlers.onChange(file.path, update.state.doc.toString())
      }
    }),
    section2Theme,
  ]
}

/** This module is loaded lazily, with CodeMirror itself. */
export function mountEditor(parent: HTMLElement, handlers: EditorHandlers): EditorHandle {
  const view = new EditorView({ parent })
  const states = new Map<string, EditorState>()
  let current: string | null = null

  return {
    showFile(file) {
      if (current !== null) {
        states.set(current, view.state)
      }
      const state =
        states.get(file.path) ??
        EditorState.create({
          doc: file.content,
          extensions: fileExtensions(file, handlers),
        })
      if (current !== file.path) {
        view.setState(state)
        current = file.path
      }
      if (view.state.doc.toString() !== file.content) {
        // Changed outside the editor (reset to starter): one undoable edit.
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: file.content } })
      }
    },
    format() {
      if (current !== null) {
        void formatView(view, current, (problem) => handlers.onFormatted(problem))
      }
    },
    reveal(line, column) {
      const doc = view.state.doc
      const target = doc.line(Math.min(Math.max(line, 1), doc.lines))
      const pos = target.from + Math.min(Math.max(column - 1, 0), target.length)
      view.dispatch({
        selection: EditorSelection.cursor(pos),
        effects: EditorView.scrollIntoView(pos, { y: 'center' }),
      })
      view.focus()
    },
    destroy() {
      view.destroy()
    },
  }
}
