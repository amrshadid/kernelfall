import type { SourceLocation } from '@kernelfall/machine/types'
import type { ILinkProvider, Terminal } from '@xterm/xterm'
import { findFileLocations } from './file-location.util'

/** Makes `file.c:12:3` in the output clickable; a click asks the editor to show it. */
export function sourceLinks(terminal: Terminal, reveal: (location: SourceLocation) => void): ILinkProvider {
  return {
    provideLinks(y, callback) {
      // xterm counts link rows and columns from 1; the buffer and the matches count from 0.
      const text = terminal.buffer.active.getLine(y - 1)?.translateToString(true) ?? ''
      const links = findFileLocations(text).map((match) => ({
        range: { start: { x: match.start + 1, y }, end: { x: match.end, y } },
        text: text.slice(match.start, match.end),
        activate: () => reveal({ file: match.file, line: match.line, column: match.column }),
      }))
      callback(links.length > 0 ? links : undefined)
    },
  }
}
