/** What a Field Guide entry describes. */
export const FIELD_GUIDE_KINDS = ['command', 'folder'] as const

export type FieldGuideKind = (typeof FIELD_GUIDE_KINDS)[number]

/** One row of the Field Guide, the Codex page of commands and folders (docs/levels/surface-survey.md). */
export interface FieldGuideEntry {
  /** As the player types or sees it: `ls`, `true`/`false`, `cmd | cmd`, `/bin`. */
  readonly name: string
  readonly kind: FieldGuideKind
  /** One line: what it is. */
  readonly what: string
  /** The syscalls it makes in the lab, by kernel name, each linked to its Codex card when there is one. */
  readonly syscalls: readonly string[]
  /** What the list can't say, e.g. `-l: a statx per entry`. */
  readonly syscallNote?: string
  /** The slot of the level where the player first meets it (`P.1`): it appears when that level starts. */
  readonly firstMet: string
  /** The slots of the levels that build it or teach the mechanism underneath. */
  readonly deepenedIn: readonly string[]
}

/** `field-guide.yaml`: when the page opens, and its entries in the order it lists them. */
export interface FieldGuide {
  /** The slot of the level whose start opens the page (`P.3`). */
  readonly opensAt: string
  readonly entries: readonly FieldGuideEntry[]
}

/** The page as the player sees it now. */
export interface FieldGuideView {
  /** False until the level that opens it has been started. */
  readonly open: boolean
  /** The entries met so far, in the guide's order. */
  readonly entries: readonly FieldGuideEntry[]
}
