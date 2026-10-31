export type CodexTab = 'cards' | 'field-guide'

export interface CodexListEntry {
  readonly id: string
  readonly term: string
  readonly href: string
  /** `filed`: earned from a completed level; `seen`: met in a level still in progress. */
  readonly state: 'filed' | 'seen'
}

export interface CodexGroup {
  /** `act2/mainline`: unique, though Act II and Act III both have a Mainline. */
  readonly key: string
  readonly name: string
  readonly entries: readonly CodexListEntry[]
  /** Cards in this region not found yet; only the count is shown (no spoilers). */
  readonly hidden: number
}
