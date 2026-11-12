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

/** One of the compiler's errors or warnings, at the place it names. */
export interface EditorDiagnostic {
  readonly path: string
  /** 1-based. */
  readonly line: number
  /** 1-based, in screen columns as gcc counts them: a tab reaches the next multiple of 8. */
  readonly column: number
  readonly severity: 'error' | 'warning'
  readonly message: string
}

/** What the last build said. A new `id` replaces the marks in every file. */
export interface DiagnosticSet {
  readonly id: number
  readonly items: readonly EditorDiagnostic[]
}

export type RunState =
  | { readonly kind: 'idle' }
  /** `reason` says why Run is off, for its title and screen readers. */
  | { readonly kind: 'busy'; readonly label: string; readonly reason: string; readonly working?: boolean }
