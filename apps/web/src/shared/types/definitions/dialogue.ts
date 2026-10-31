import type { ReactNode } from 'react'

export interface PortraitProps {
  /** Rendered size in px; portraits read at 32px (avatar) up to 96px (dialogue). */
  size?: number
}

/** Who is talking, named with the real thing they stand for the first time they appear. */
export interface Speaker {
  readonly id: string
  readonly name: string
  /** The real term, e.g. "PID 1, the first userspace process". */
  readonly term: string
  /** Large portrait (56px) for the header. */
  readonly portrait: ReactNode
  /** Small portrait (30px) for a cut-in. */
  readonly avatar: ReactNode
}

export interface DialogueLine {
  readonly speaker: Speaker
  readonly text: ReactNode
}

export interface DialogueGroup {
  readonly speaker: Speaker
  readonly texts: readonly ReactNode[]
}
