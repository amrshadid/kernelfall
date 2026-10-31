/** Cuts text to `max` characters with an ellipsis, so a line stays inside its box. */
export function fitText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** The first line of program output, with a trailing newline dropped. */
export function firstLine(text: string): string {
  return text.replace(/\n$/, '').split('\n')[0] ?? ''
}
