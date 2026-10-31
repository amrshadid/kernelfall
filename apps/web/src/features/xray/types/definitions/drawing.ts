export interface DrawingTableRow {
  readonly label: string
  readonly value: string
  /** Highlighted: this row changed or matters now. */
  readonly on?: boolean
  /** Redrawn with a flip when its value changes (the CPU's mode). */
  readonly flip?: boolean
}

/** Shared copy-on-write pages are hatched; a new program's are toned. */
export type PageKind = 'own' | 'shared' | 'new'

export interface ProcessPages {
  readonly labels: readonly string[]
  readonly kind: PageKind
  readonly hidden: boolean
}
