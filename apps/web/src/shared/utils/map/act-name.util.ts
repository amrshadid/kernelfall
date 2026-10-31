import type { Act, ActOutline } from '@kernelfall/game/types'

const SUBTITLE_SEPARATOR = ':'

/** An act's name without its subtitle: "Act I: Userland" → "Act I"; "Prologue" stays. */
export function shortActName(name: string): string {
  return name.split(SUBTITLE_SEPARATOR)[0] ?? name
}

/** The short name of `act` in the outline; the first act's for an act the outline lacks. */
export function actNameOf(acts: readonly ActOutline[], act: Act): string {
  const outline = acts.find((candidate) => candidate.act === act) ?? acts[0]
  return outline ? shortActName(outline.name) : ''
}
