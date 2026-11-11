/** Cuts text to `max` characters with an ellipsis, so a line stays inside its box. */
export function fitText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** Words in lines of at most `max` characters; what doesn't fit in `lines` is cut with an ellipsis. */
export function wrapText(text: string, max: number, lines: number): readonly string[] {
  const out: string[] = []
  let line = ''
  // Only plain spaces break, so a no-break space keeps "fd 1" on one line.
  for (const word of text.split(' ').filter(Boolean)) {
    if (line === '' || line.length + 1 + word.length <= max) {
      line = line === '' ? word : `${line} ${word}`
      continue
    }
    out.push(line)
    line = word
  }
  if (line !== '') {
    out.push(line)
  }
  const kept = out.slice(0, lines).map((l) => fitText(l, max))
  const last = kept.at(-1)
  if (out.length > lines && last !== undefined && !last.endsWith('…')) {
    kept[kept.length - 1] = last.length < max ? `${last}…` : `${last.slice(0, max - 1)}…`
  }
  return kept
}

/** The first line of program output, with a trailing newline dropped. */
export function firstLine(text: string): string {
  return text.replace(/\n$/, '').split('\n')[0] ?? ''
}
