/** Structurally the game's `CodexCard`. */
export interface CodexCardData {
  readonly id: string
  readonly term: string
  readonly summary: string
  readonly sources: readonly string[]
  readonly docs: string
  readonly tryIt: string
}
