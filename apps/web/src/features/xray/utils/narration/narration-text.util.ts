/** Longest C string the narration quotes before it is cut with an ellipsis: about one line. */
const MAX_QUOTED_CHARS = 40

/** Sets a term in the code face: narration marks code with backticks. */
export const code = (text: string | number): string => `\`${text}\``

/** One trailing newline dropped, other newlines and tabs kept visible as escapes, at most a line long. */
export function shownText(text: string): string {
  const escaped = text.replace(/\n$/, '').replaceAll('\n', '\\n').replaceAll('\t', '\\t')
  return escaped.length > MAX_QUOTED_CHARS ? `${escaped.slice(0, MAX_QUOTED_CHARS)}…` : escaped
}

/** To continue another sentence. */
export const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1)
