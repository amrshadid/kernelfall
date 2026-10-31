/** Hacks that add Taint (docs/GAME.md §5, docs/LEVELS.md). */
export const TAINT_KINDS = [
  'memory_leak',
  'ignored_error',
  'missing_cleanup',
  'lock_misuse',
  'kasan_report',
  'lockdep_report',
  'compiler_warning',
  'style_error',
] as const

export const ENDINGS = ['clean_reboot', 'unstable_reboot', 'dangling_survives'] as const

/**
 * Acts whose Taint decides the ending. The ending is picked at the end of Act II,
 * and Act I Taint is shown but doesn't count (docs/GAME.md §5).
 */
export const ENDING_ACTS = ['act2'] as const

// PROVISIONAL: from the Act II design (docs/levels/act-2-the-deep.md), where rules
// weigh minor 1, moderate 3, severe 5. Tune after the first playtests.
// These are the defaults of `GameOptions`.
/** The most total Taint that still earns the clean reboot. */
export const CLEAN_REBOOT_MAX_TAINT = 9
/** The most total Taint that still earns the unstable reboot; above it the Dangling survives. */
export const UNSTABLE_REBOOT_MAX_TAINT = 29
/** A single level adds at most this much, so one messy level can't decide the ending alone. */
export const MAX_LEVEL_TAINT = 10

export type TaintKind = (typeof TAINT_KINDS)[number]
export type Ending = (typeof ENDINGS)[number]

/** A hack a checker found, naming the level's Taint rule it breaks. */
export interface TaintEvent {
  readonly ruleId: string
  /** What exactly happened, shown in the debrief, e.g. "write() returned -EBADF and was ignored". */
  readonly detail: string
  /** The `seq` of the lab event that revealed it, so X-ray can point at it. */
  readonly seq?: number
}

/** A hack a declared Taint check found; the level's rule gives it its `ruleId`. */
export type TaintFinding = Omit<TaintEvent, 'ruleId'>

/** A Taint event priced with its rule's points, as stored in the ledger. */
export interface TaintEntry {
  readonly levelId: string
  readonly ruleId: string
  readonly kind: TaintKind
  readonly points: number
  readonly detail: string
}

/** Every priced Taint entry, from the latest completion of each level. */
export type TaintLedger = readonly TaintEntry[]
