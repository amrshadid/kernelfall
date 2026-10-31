import type { XraySource } from '@kernelfall/levels/types'

/** The X-ray views this panel draws. Other views in a level's list are not built yet. */
export type XrayLens = 'syscalls' | 'processes' | 'cpus' | 'route' | 'section' | 'boot'

/** Simple shows the Gatekeeper and plain words; Deep shows registers and kernel functions. */
export type XrayDepth = 'simple' | 'deep'

/** A file in the Linux tree a stage is checked against, and the function in it. */
export type StageSource = XraySource

/** A guess the player can commit before a stage plays. Never scored. */
export interface StagePredict {
  readonly question: string
  readonly options: readonly string[]
  readonly answer: string
  /** Why the answer is what it is, and what the other options would have meant. */
  readonly explain: string
}

export interface StageText {
  /** A word or two for the transport's tick. */
  readonly tick: string
  readonly title: string
  readonly what: string
  /** Why the kernel does it this way. */
  readonly why: string
  /** One more step down, opened by default at Deep. */
  readonly deeper: string
  /** The Gatekeeper's line, at Simple, for stages at the Gate. */
  readonly gate?: string
  /** Where the drawing differs from Linux here. */
  readonly simplified?: string
  readonly sources: readonly StageSource[]
  readonly predict?: StagePredict
}

/** Text may mark real terms with backticks; they are set in the code face. */
export interface Stage<Scene> extends StageText {
  /** Unique within its storyboard; also keys the player's guesses. */
  readonly key: string
  readonly scene: Scene
}

export type PlaybackSpeed = 0.5 | 1 | 2

/** The options and answer of a guess worked out from the call, when they are numbers. */
export interface PredictChoices {
  readonly options: readonly string[]
  readonly answer: string
}

export interface StageTextOptions {
  /** Sources for a stage whose content names none: the syscall's own. */
  readonly sources?: readonly StageSource[]
  /** `null` when there is nothing to guess, like a write that never returned. */
  readonly predict?: PredictChoices | 'content' | null
  /** False drops the Gatekeeper's line: nothing crossed the Gate at this stage (a child killed by a signal). */
  readonly gate?: boolean
}

export interface PlayerState {
  /** The storyboard the state belongs to, once one has loaded. */
  readonly board: string | null
  /** The stage the drawing and narration show. */
  readonly index: number
  /** A stage waiting for the player's guess before it plays; the one before it stays up. */
  readonly pending: number | null
  readonly playing: boolean
  readonly speed: PlaybackSpeed
}

/** One stage of the transcript: what a screen reader reads instead of the drawing. */
export interface TranscriptEntry {
  readonly key: string
  readonly title: string
  readonly what: string
  readonly why: string
}
