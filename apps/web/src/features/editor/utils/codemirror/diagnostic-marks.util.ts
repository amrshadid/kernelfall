import { type Extension, type Range, StateEffect, StateField, type Text } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, hoverTooltip } from '@codemirror/view'
import type { EditorDiagnostic } from '@features/editor/types'
import { offsetOfColumn } from '@features/editor/utils/diagnostics'

/** Replaces the open file's marks. */
export const setDiagnosticMarks = StateEffect.define<readonly EditorDiagnostic[]>()

// The token gcc points at: a word, or the one character there.
const TOKEN = /^(?:\w+|\S)/

const label = (diagnostic: EditorDiagnostic): string => `${diagnostic.severity}: ${diagnostic.message}`

function marksOf(doc: Text, diagnostics: readonly EditorDiagnostic[]): DecorationSet {
  const ranges: Range<Decoration>[] = []
  for (const diagnostic of diagnostics) {
    if (diagnostic.line < 1 || diagnostic.line > doc.lines) {
      continue
    }
    const line = doc.line(diagnostic.line)
    const text = label(diagnostic)
    ranges.push(
      Decoration.line({ class: `cm-kf-line cm-kf-line--${diagnostic.severity}`, attributes: { title: text } }).range(
        line.from
      )
    )
    if (line.length === 0) {
      continue
    }
    // gcc points past the end for a missing token (`return 0` with no `;`): mark the last character.
    const offset = Math.min(offsetOfColumn(line.text, diagnostic.column), line.length - 1)
    const length = line.text.slice(offset).match(TOKEN)?.[0].length ?? 1
    ranges.push(
      Decoration.mark({ class: `cm-kf-mark cm-kf-mark--${diagnostic.severity}`, message: text }).range(
        line.from + offset,
        line.from + offset + length
      )
    )
  }
  return Decoration.set(ranges, true)
}

// Marks move with the text as the player types, and stay until the next build replaces them.
const marks = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(current, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setDiagnosticMarks)) {
        return marksOf(transaction.state.doc, effect.value)
      }
    }
    return current.map(transaction.changes)
  },
  provide: (field) => EditorView.decorations.from(field),
})

const messages = hoverTooltip((view, pos) => {
  const found: string[] = []
  let from = pos
  let to = pos
  view.state.field(marks).between(pos, pos, (start, end, decoration) => {
    const message: unknown = decoration.spec.message
    if (typeof message === 'string') {
      found.push(message)
      from = Math.min(from, start)
      to = Math.max(to, end)
    }
  })
  if (found.length === 0) {
    return null
  }
  return {
    pos: from,
    end: to,
    above: true,
    create() {
      const dom = document.createElement('div')
      dom.className = 'cm-kf-diagnostic'
      for (const message of found) {
        dom.appendChild(document.createElement('p')).textContent = message
      }
      return { dom }
    },
  }
})

/** gcc's errors and warnings, drawn on the lines they name. */
export const diagnosticMarks: Extension = [marks, messages]
