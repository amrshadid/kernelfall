import type { LabSetup } from '@kernelfall/machine/types'
import type { ObjectiveCheck, TaintCheck } from '#types/definitions/checks'
import type { TaintKind } from '#types/definitions/taint'

export const ACTS = ['prologue', 'act1', 'act2', 'act3'] as const

/** Curriculum tracks (docs/LEVELS.md). */
export const TRACKS = ['c', 'userland', 'kernel', 'net', 'debug'] as const

/** X-ray views a level can demonstrate (docs/GAME.md §5); `boot` follows the boot stage by stage (P.4). */
export const XRAY_VIEWS = ['syscalls', 'processes', 'files', 'network', 'modules', 'memory', 'locks', 'boot'] as const

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** The part of a level id after `<act>-<region>-`: a two-digit number, then a slug. */
export const LEVEL_NUMBER_AND_SLUG_PATTERN = /^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/

/** A section of a story file, e.g. `story.md#scene`. */
export const STORY_REF_PATTERN = /^[a-z0-9-]+\.md#[a-z0-9-]+$/

/** A path inside the kernel tree, e.g. `kernel/fork.c`. */
export const KERNEL_PATH_PATTERN = /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/

export const DOCS_URL_PATTERN = /^https:\/\/\S+$/

/** The longest a level's `minutes` may say: a level past two hours should be split. */
export const MAX_LEVEL_MINUTES = 120

export type LevelId = string
export type SkillId = string
export type Act = (typeof ACTS)[number]
export type Track = (typeof TRACKS)[number]
export type XrayView = (typeof XRAY_VIEWS)[number]

/** Something the checker verifies by behavior, e.g. "the shell runs `ls` in a child". */
export interface Objective {
  readonly id: string
  readonly text: string
  /** How the engine judges it; left out, the level's own checker reports it. */
  readonly check?: ObjectiveCheck
}

/** A command offered as a chip the player clicks or types, with what it does in plain words. */
export interface CommandChip {
  /** The whole line (`ls /bin`) before P.3; from P.3 on, the command's name alone (`wc`). */
  readonly command: string
  /** One line: "list the folder /bin". */
  readonly explain: string
}

/** A command root runs as another user once an objective is first met (S.2's neighbour knocking), traced and judged. */
export interface RunAsCue {
  /** The objective's id. */
  readonly after: string
  /** root, `you` or one of `lab.users`. */
  readonly user: string
  readonly command: string
}

/** In tier order: nudge, concept, point at the spot. */
export type LevelHints = readonly [nudge: string, concept: string, spot: string]

/** A hack the level punishes with Taint, reported by `id`. */
export interface TaintRule {
  readonly id: string
  readonly kind: TaintKind
  readonly points: number
  readonly description: string
  /** How the engine finds it; left out, the level's own checker reports it (or nothing does yet). */
  readonly check?: TaintCheck
}

/** A Codex entry: the real term, what it is, where it lives upstream, how to try it. */
export interface CodexCard {
  readonly id: string
  readonly term: string
  /** One line for lists; a card written with `simple` uses it as its summary. */
  readonly summary: string
  /** The plain-words line. */
  readonly simple?: string
  /** The kernel's side: functions, structs, source files. */
  readonly deep?: string
  /** An earlier card this one adds to, by id, instead of starting a new chain. */
  readonly deepens?: string
  /** Paths in the kernel tree, e.g. `kernel/fork.c`. */
  readonly sources: readonly string[]
  readonly docs: string
  /** A command or snippet to try on real Linux. */
  readonly tryIt: string
}

/** What the level teaches exactly as Linux does it, and where it simplifies. */
export interface Fidelity {
  readonly faithful: readonly string[]
  readonly simplified: readonly string[]
}

/** Sections of the level's story file, e.g. `story.md#scene`. */
export interface StoryRefs {
  readonly scene: string
  readonly debrief: string
  readonly realWorld: string
}

/** The act and region a level sits in, given by its folders rather than its `level.yaml`. */
export interface LevelLocation {
  readonly act: Act
  readonly region: string
}

/** One level: its `level.yaml` (docs/LEVELS.md) and the act and region its folders put it in. */
export interface LevelDefinition {
  readonly id: LevelId
  readonly title: string
  /** One or two plain sentences for the Kernel Map: what the player does and learns. */
  readonly summary?: string
  /** About how long the level takes a new player, shown on the map and the level card. */
  readonly minutes?: number
  readonly act: Act
  readonly region: string
  readonly tracks: readonly Track[]
  /** Skill-tree nodes completing this level unlocks. */
  readonly skills: readonly SkillId[]
  /** Skills that must be unlocked before the level can be played. */
  readonly prerequisites: readonly SkillId[]
  readonly objectives: readonly Objective[]
  readonly hints: LevelHints
  /** The command chips "build it" offers, in order; left out, none. */
  readonly chips?: readonly CommandChip[]
  /** Empty before X-ray is unlocked (P.1). */
  readonly xray: readonly XrayView[]
  /** Calls X-ray keeps open that no declared check names, such as the shell's fork and pipe. */
  readonly xrayFocus?: readonly string[]
  readonly codex: readonly CodexCard[]
  readonly taint: readonly TaintRule[]
  readonly fidelity: Fidelity
  readonly story: StoryRefs
  /** The Machine the level starts on; left out, the one every level shares. */
  readonly lab?: LabSetup
  /** Run once per play-through, in "build it". */
  readonly runAs?: readonly RunAsCue[]
}
