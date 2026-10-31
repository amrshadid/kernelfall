import type { ReactNode } from 'react'

export type ButtonVariant = 'default' | 'primary' | 'quiet'

/** `lg` is the title screen's Continue; `sm` fits dense bars like the X-ray scrubber. */
export type ButtonSize = 'sm' | 'md' | 'lg'

/** `clean`: done with zero Taint; `helped`: completed with init's version. */
export type NodeState = 'locked' | 'available' | 'progress' | 'done' | 'clean' | 'helped'

export type StepState = 'done' | 'current' | 'future'

/** The five visible steps of the level loop. */
export type StepId = 'scene' | 'see' | 'build' | 'watch' | 'card'

export interface RailStep {
  readonly id: string
  readonly label: string
}

export interface TitleBlockEntry {
  readonly label: string
  readonly value: ReactNode
  /** `good` prints the value in the "passed / clean" green, e.g. a Revision with no Taint. */
  readonly tone?: 'good' | 'taint'
}

export interface ManPageSection {
  /** The section name as a man page prints it: NAME, SYNOPSIS, RETURN VALUE, SEE ALSO… */
  readonly name: string
  readonly body: ReactNode
}

export interface ContentsEntry {
  readonly id: string
  readonly name: string
  /** The page reference after the leader dots, e.g. "Act I, 3 of 10 rebuilt". */
  readonly reference: ReactNode
  /** A link target, or `onSelect` for an action like New game. */
  readonly href?: string
  readonly onSelect?: () => void
}
