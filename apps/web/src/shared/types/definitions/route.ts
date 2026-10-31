/** The Settings screen's sections, in the order they print: each has its own `#/settings/<section>`. */
export const SETTINGS_SECTIONS = ['display', 'gameplay', 'keyboard', 'saves', 'privacy', 'about'] as const

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]

export type Route =
  | { readonly name: 'title' }
  | { readonly name: 'map' }
  /** `card` is a Codex card open over the level (`#/play/<level>?card=<id>`), so Back closes it. */
  | { readonly name: 'play'; readonly levelId: string; readonly card?: string }
  | { readonly name: 'codex'; readonly cardId: string | null }
  | { readonly name: 'settings'; readonly section: SettingsSectionId | null }
  /** A region's placement check (`#/placement/<act>/<region>`). */
  | { readonly name: 'placement'; readonly act: string; readonly regionId: string }
  | { readonly name: 'not-found' }
