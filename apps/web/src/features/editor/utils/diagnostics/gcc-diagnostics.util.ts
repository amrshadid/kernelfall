import type { EditorDiagnostic } from '@features/editor/types'
import { GCC_TAB_STOP } from './gcc-diagnostics.constants'

/** The part of a trace event this reads: a `console_write` carries the bytes that reached the terminal. */
export interface ConsoleEvent {
  readonly type: string
  readonly bytes?: Uint8Array
}

// Built from character codes so the source holds no control character.
const ESC = String.fromCharCode(27)
const BEL = String.fromCharCode(7)
// On a terminal gcc colours its lines (ESC [ … m) and makes a warning's option a link (ESC ] 8 ;; url BEL).
const COLOUR = new RegExp(`${ESC}(?:\\[[0-9;]*[A-Za-z]|\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\))`, 'g')
const NUL = new RegExp(String.fromCharCode(0), 'g')

// "hello.c:19:17: error: expected ';' before '}' token". Notes belong to the line before them and are left out.
const DIAGNOSTIC = /((?:\.\/)?[\w./-]+\.[ch]):(\d+):(\d+): (fatal error|error|warning): (.+)$/

/** Everything a command wrote to the terminal, in order. */
export function consoleTextOf(events: readonly ConsoleEvent[]): string {
  const decoder = new TextDecoder()
  return events
    .map((event) => (event.type === 'console_write' && event.bytes ? decoder.decode(event.bytes) : ''))
    .join('')
}

/** The errors and warnings in what a build printed to the terminal, in the order gcc gave them, each once. */
export function gccDiagnosticsOf(output: string): EditorDiagnostic[] {
  const seen = new Set<string>()
  const found: EditorDiagnostic[] = []
  for (const raw of output.split('\n')) {
    const match = raw.replace(COLOUR, '').replace(NUL, '').trimEnd().match(DIAGNOSTIC)
    if (!match) {
      continue
    }
    const [, file = '', line, column, kind, message = ''] = match
    const diagnostic: EditorDiagnostic = {
      path: file.replace(/^\.\//, ''),
      line: Number(line),
      column: Number(column),
      severity: kind === 'warning' ? 'warning' : 'error',
      message,
    }
    const key = JSON.stringify(diagnostic)
    if (!seen.has(key)) {
      seen.add(key)
      found.push(diagnostic)
    }
  }
  return found
}

/** Where gcc's column falls in a line's text, 0-based: gcc counts screen columns, so a tab is up to 8 of them. */
export function offsetOfColumn(text: string, column: number): number {
  let at = 1
  for (let offset = 0; offset < text.length; offset++) {
    if (at >= column) {
      return offset
    }
    at = text[offset] === '\t' ? at + GCC_TAB_STOP - ((at - 1) % GCC_TAB_STOP) : at + 1
  }
  return text.length
}

/** "gcc: 1 error, 2 warnings, marked on their lines"; null when the build said nothing. */
export function diagnosticsSummary(items: readonly EditorDiagnostic[]): string | null {
  const count = (severity: EditorDiagnostic['severity']) => {
    const n = items.filter((item) => item.severity === severity).length
    return n === 0 ? [] : [`${n} ${severity}${n === 1 ? '' : 's'}`]
  }
  const parts = [...count('error'), ...count('warning')]
  return parts.length === 0
    ? null
    : `gcc: ${parts.join(', ')}, marked on ${items.length === 1 ? 'its line' : 'their lines'}`
}
