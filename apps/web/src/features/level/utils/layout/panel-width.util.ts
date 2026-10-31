export interface HeaderReach {
  /** The header's right edge, in viewport px. */
  readonly headerRight: number
  /** The rule on the header's right side, which stands over the panel's divider. */
  readonly ruleWidth: number
  /** The panel's left edge, in viewport px. */
  readonly panelLeft: number
  readonly remPx: number
}

// In rem, the unit the Guide's size is kept in; null before both are laid out.
export function headerWidthRem({ headerRight, ruleWidth, panelLeft, remPx }: HeaderReach): number | null {
  const width = headerRight - ruleWidth - panelLeft
  return width > 0 && remPx > 0 ? width / remPx : null
}
