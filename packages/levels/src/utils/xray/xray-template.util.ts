import type { TemplateValues } from '#types/index'

const PLACEHOLDER = /\{([A-Za-z][A-Za-z0-9]*)\}/g

/**
 * Fills a content template's `{name}` placeholders in one pass, so a value
 * that itself holds braces (a printed C string) is never filled again. A
 * placeholder without a value is left as written, where a test can catch it.
 */
export function fillTemplate(template: string, values: TemplateValues): string {
  return template.replace(PLACEHOLDER, (placeholder, name: string) => {
    const value = values[name]
    return value === undefined ? placeholder : String(value)
  })
}

/** The placeholders a filled text still holds: none, once every value was given. */
export function unfilledPlaceholders(text: string): readonly string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1] ?? '')
}
