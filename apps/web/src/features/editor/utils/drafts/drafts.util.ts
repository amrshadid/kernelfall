import type { FileContents } from '@features/editor/types'

/** C text with layout ignored: whitespace runs kept only where they separate two words (`int x`). */
export function withoutLayout(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/ ?([^\w ]) ?/g, '$1')
    .trim()
}

/** A draft differing from its starter only in layout predates a starter reformat and was never edited. */
export function refreshUntouchedDrafts(drafts: FileContents, starter: FileContents): FileContents {
  let changed = false
  const fresh: Record<string, string> = {}
  for (const [path, text] of Object.entries(drafts)) {
    const current = starter[path]
    const untouched = current !== undefined && text !== current && withoutLayout(text) === withoutLayout(current)
    fresh[path] = untouched ? current : text
    changed ||= untouched
  }
  return changed ? fresh : drafts
}
