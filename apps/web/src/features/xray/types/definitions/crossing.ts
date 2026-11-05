import type { SectionPartId } from './section'
import type { Stage } from './storyboard'
import type { XrayCall } from './xray-call'

/** Simple's beats of one syscall: the ask, the Gate, the kernel's work, the device, the answer. */
export type CrossingBeat = 'ask' | 'gate' | 'kernel' | 'device' | 'answer'

export interface CrossingScene {
  readonly beat: CrossingBeat
}

/** A part of the kernel the call works in, as the Section drawing names it. */
export interface CrossingPart {
  /** Null when X-ray doesn't know which part runs the call: then it is only "the kernel". */
  readonly id: SectionPartId | null
  readonly name: string
  /** The real name under it, in small type: the driver or filesystem, or where it lives in the tree. */
  readonly detail: string
  /** The part that served the call: it lights at the kernel beat. */
  readonly served: boolean
}

/** What comes back up through the Gate, for the card. */
export interface CrossingAnswer {
  /** `6`, `-1`, or `none` when nothing comes back. */
  readonly value: string
  readonly meaning: string
}

export interface CrossingStoryboard {
  readonly key: string
  readonly call: XrayCall
  /** The request in plain words, e.g. "write 6 bytes to fd 1 (your terminal)". */
  readonly request: string
  readonly parts: readonly CrossingPart[]
  /** What reached the terminal, when the call drew on it. */
  readonly terminal: string | null
  readonly answer: CrossingAnswer
  readonly stages: readonly Stage<CrossingScene>[]
}
