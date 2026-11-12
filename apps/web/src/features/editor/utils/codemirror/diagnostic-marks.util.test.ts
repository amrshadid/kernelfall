import { EditorState } from '@codemirror/state'
import { type DecorationSet, EditorView } from '@codemirror/view'
import type { EditorDiagnostic } from '@features/editor/types'
import { describe, expect, it } from 'vitest'
import { diagnosticMarks, setDiagnosticMarks } from './diagnostic-marks.util'

const HELLO = '#include <stdio.h>\n\nint main(void)\n{\n\tint unused;\n\treturn 0\n}\n'

const error: EditorDiagnostic = {
  path: 'hello.c',
  line: 6,
  column: 17,
  severity: 'error',
  message: "expected ';' before '}' token",
}
const warning: EditorDiagnostic = {
  path: 'hello.c',
  line: 5,
  column: 13,
  severity: 'warning',
  message: "unused variable 'unused'",
}

// Each mark as "class: marked text"; a line mark covers no text.
function marksIn(state: EditorState): string[] {
  const found: string[] = []
  for (const source of state.facet(EditorView.decorations)) {
    const set = source as DecorationSet
    const cursor = set.iter()
    while (cursor.value) {
      found.push(`${String(cursor.value.spec.class)}: ${state.sliceDoc(cursor.from, cursor.to)}`)
      cursor.next()
    }
  }
  return found
}

const marked = (items: readonly EditorDiagnostic[]) =>
  EditorState.create({ doc: HELLO, extensions: diagnosticMarks }).update({ effects: setDiagnosticMarks.of(items) })
    .state

describe('diagnosticMarks', () => {
  it('marks the line and the token gcc points at, counting the tab as gcc does', () => {
    expect(marksIn(marked([warning]))).toEqual([
      'cm-kf-line cm-kf-line--warning: ',
      'cm-kf-mark cm-kf-mark--warning: unused',
    ])
  })

  it('marks the last character when gcc points past the end of the line', () => {
    expect(marksIn(marked([error]))).toEqual(['cm-kf-line cm-kf-line--error: ', 'cm-kf-mark cm-kf-mark--error: 0'])
  })

  it('moves the marks with the text, and drops them for the next build', () => {
    const state = marked([error])
    const typed = state.update({ changes: { from: 0, insert: '// a new first line\n' } }).state
    expect(marksIn(typed)).toEqual(marksIn(state))
    expect(typed.doc.lineAt(typed.doc.toString().indexOf('return 0')).number).toBe(7)

    expect(marksIn(typed.update({ effects: setDiagnosticMarks.of([]) }).state)).toEqual([])
  })

  it('ignores a line the file does not have', () => {
    expect(marksIn(marked([{ ...error, line: 99 }]))).toEqual([])
  })
})
