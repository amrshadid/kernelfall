import type { TextMatch } from '#types/definitions/checks'

/** Whether `text` meets every condition `match` gives. */
export function matchesText(text: string, match: TextMatch): boolean {
  return (
    (match.equals === undefined || text === match.equals) &&
    (match.notEquals === undefined || text !== match.notEquals) &&
    (match.contains === undefined || text.includes(match.contains)) &&
    (match.notContains === undefined || !text.includes(match.notContains)) &&
    (match.endsWith === undefined || text.endsWith(match.endsWith))
  )
}
