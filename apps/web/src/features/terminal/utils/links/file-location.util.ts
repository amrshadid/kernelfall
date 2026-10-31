/** A `file:line[:column]` found in a line of terminal output. */
export interface FileLocationMatch {
  readonly file: string
  readonly line: number
  readonly column: number
  /** Where the match sits in the text, 0-based, end exclusive. */
  readonly start: number
  readonly end: number
}

// C sources and headers, as gcc prints them: "ksh.c:14:5", "./util.h:3".
const LOCATION = /(?<![\w./-])((?:\.\/)?[\w./-]+\.[ch]):(\d+)(?::(\d+))?/g

export function findFileLocations(text: string): FileLocationMatch[] {
  return [...text.matchAll(LOCATION)].map((match) => ({
    file: (match[1] ?? '').replace(/^\.\//, ''),
    line: Number(match[2]),
    column: match[3] === undefined ? 1 : Number(match[3]),
    start: match.index,
    end: match.index + match[0].length,
  }))
}
