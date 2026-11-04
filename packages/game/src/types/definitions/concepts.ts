import type { LevelId } from '#types/definitions/level'

/**
 * Where a concept sits on the Section drawing: Userland, the Gate, the kernel's parts
 * and the hardware, plus the boot path through all of them and the foundations
 * (numbers, text) that sit on no part.
 */
export const CONCEPT_PARTS = [
  'foundations',
  'userland',
  'gate',
  'kernel',
  'processes',
  'scheduler',
  'memory',
  'vfs',
  'security',
  'drivers',
  'modules',
  'networking',
  'logging',
  'boot',
  'hardware',
] as const

/** New core concepts one level may teach (docs/LEVELS.md). */
export const CORE_CONCEPT_BUDGET = 3

export const CONCEPT_VIOLATION_KINDS = ['used-before-taught', 'taught-twice', 'never-used-again'] as const

export type ConceptId = string
export type ConceptPart = (typeof CONCEPT_PARTS)[number]
export type ConceptViolationKind = (typeof CONCEPT_VIOLATION_KINDS)[number]

/** One entry of `concepts.yaml`. */
export interface Concept {
  readonly id: ConceptId
  /** As the player meets it: "file descriptor", "`|` pipe". */
  readonly term: string
  readonly part: ConceptPart
  /** The Codex card that explains it. */
  readonly codex?: string
}

/** `concepts.yaml`: every concept a level may teach or use. */
export interface ConceptCatalogue {
  readonly concepts: readonly Concept[]
}

/** A break in the chain of concepts, in play order. */
export interface ConceptViolation {
  readonly kind: ConceptViolationKind
  readonly concept: ConceptId
  /** The level that uses it too early, teaches it again, or taught it with no level using it after. */
  readonly levelId: LevelId
  /** The level that teaches it later, or taught it first; null when there is none. */
  readonly other: LevelId | null
}
