/** In tab order. */
export type FileContents = Readonly<Record<string, string>>

export interface EditorFile {
  readonly path: string
  readonly content: string
  /** Files the player may read but not change (shown with a lock). */
  readonly readOnly?: boolean
}

/** A new `id` repeats the request even for the same place. */
export interface RevealRequest {
  readonly id: number
  readonly path: string
  readonly line: number
  readonly column: number
}

export type RunState =
  | { readonly kind: 'idle' }
  /** `reason` says why Run is off, for its title and screen readers. */
  | { readonly kind: 'busy'; readonly label: string; readonly reason: string }
