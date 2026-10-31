export interface FormatEdit {
  /** Null when formatting changed nothing. */
  readonly change: { readonly from: number; readonly to: number; readonly insert: string } | null
  readonly cursor: number
}

const isSpace = (char: string | undefined): boolean => char !== undefined && /\s/.test(char)

/** Index of the `count`-th (1-based) non-whitespace character in `text`, or its length. */
function nthToken(text: string, count: number): number {
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    if (!isSpace(text[i])) {
      seen++
      if (seen === count) {
        return i
      }
    }
  }
  return text.length
}

/** clang-format only moves whitespace here, so the cursor keeps its place among the other characters. */
export function mapCursor(before: string, after: string, cursor: number): number {
  let tokensBefore = 0
  for (let i = 0; i < cursor; i++) {
    if (!isSpace(before[i])) {
      tokensBefore++
    }
  }
  let next = cursor
  while (next < before.length && isSpace(before[next]) && before[next] !== '\n') {
    next++
  }
  if (next < before.length && !isSpace(before[next])) {
    return nthToken(after, tokensBefore + 1)
  }
  return tokensBefore === 0 ? 0 : Math.min(nthToken(after, tokensBefore) + 1, after.length)
}

/** The smallest single replacement, so marks and scroll outside the changed span stay put. */
export function formatEdit(before: string, after: string, cursor: number): FormatEdit {
  if (before === after) {
    return { change: null, cursor }
  }
  const shorter = Math.min(before.length, after.length)
  let prefix = 0
  while (prefix < shorter && before[prefix] === after[prefix]) {
    prefix++
  }
  let suffix = 0
  while (suffix < shorter - prefix && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) {
    suffix++
  }
  return {
    change: { from: prefix, to: before.length - suffix, insert: after.slice(prefix, after.length - suffix) },
    cursor: mapCursor(before, after, cursor),
  }
}
