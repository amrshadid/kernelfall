import type { LabEvent } from '@kernelfall/machine/events'
import type { BootSummary } from '@kernelfall/machine/types'
import type { LevelId, Objective } from '#types/definitions/level'
import type { TaintEvent } from '#types/definitions/taint'

export interface CompilerWarning {
  readonly message: string
  /** Null for a warning about no particular line, such as one from the linker. */
  readonly location: { readonly file: string; readonly line: number; readonly column: number } | null
  /** e.g. `-Wunused-variable`. */
  readonly flag: string | null
}

/** The level's compiles so far, read from the gcc runs in its commands' events. */
export interface BuildHistory {
  /** A compile before the latest one failed with an error. */
  readonly failedEarlier: boolean
  readonly latestErrors: number
}

/** The lab events of one command line, and what the compiles reported; or a boot that just ran. */
export interface CheckInput {
  readonly events: readonly LabEvent[]
  /** Missing where no compiler is wired in (tests of the lab events alone): read as none. */
  readonly warnings?: readonly CompilerWarning[]
  /** Missing where no compiler is wired in: read as no failed build. */
  readonly builds?: BuildHistory
  /** A boot, judged with no events: it happens before any task the player could run. */
  readonly boot?: BootSummary
}

/** By the ids in the level definition. */
export interface CheckReport {
  readonly objectivesMet: readonly string[]
  readonly taint: readonly TaintEvent[]
}

/** Judges behavior in the event stream, never the player's source. Must be pure. */
export interface LevelChecker {
  /** Whether the command ran the player's program (`cc` alone or `echo` aren't judged). Defaults to every command. */
  applies?(input: CheckInput): boolean
  check(input: CheckInput): CheckReport
}

export type LevelCheckers = Readonly<Record<LevelId, LevelChecker>>

/** Passed only if every objective is met. */
export interface CheckVerdict {
  readonly passed: boolean
  readonly missing: readonly Objective[]
  readonly taint: readonly TaintEvent[]
}
