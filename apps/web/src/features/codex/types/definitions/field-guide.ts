export interface FieldGuideLink {
  readonly text: string
  /** The Codex card or level it opens; null when there's none to open yet. */
  readonly href: string | null
}

export interface FieldGuideRow {
  readonly name: string
  readonly what: string
  /** Each syscall it makes, linked to its Codex card once that card is found. */
  readonly syscalls: readonly FieldGuideLink[]
  readonly syscallNote: string | null
  /** `P.3 Speak to the Shell`. */
  readonly firstMet: string
  readonly deepenedIn: readonly string[]
}

export interface FieldGuideSection {
  readonly title: string
  readonly rows: readonly FieldGuideRow[]
}
