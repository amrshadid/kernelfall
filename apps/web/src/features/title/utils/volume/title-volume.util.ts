/** "Act I: Userland": the act's number, then its subtitle. */
const NUMBERED_ACT = /^Act\s+([IVXLC]+)(?::\s*(.+))?$/

/** "Act I: Userland" → "Volume I: Userland"; an act without a number ("Prologue") keeps its name. */
export function volumeOf(actName: string): string {
  const match = NUMBERED_ACT.exec(actName)
  if (!match) {
    return actName
  }
  const [, numeral, subtitle] = match
  return subtitle ? `Volume ${numeral}: ${subtitle}` : `Volume ${numeral}`
}
