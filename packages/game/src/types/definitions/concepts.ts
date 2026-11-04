import type { LevelId } from '#types/definitions/level'

// The Section drawing's parts; `foundations` (numbers, text) sits on none of them.
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

export const CORE_CONCEPT_BUDGET = 3

export const CONCEPT_VIOLATION_KINDS = ['used-before-taught', 'taught-twice', 'never-used-again'] as const

export type ConceptId = string
export type ConceptPart = (typeof CONCEPT_PARTS)[number]
export type ConceptViolationKind = (typeof CONCEPT_VIOLATION_KINDS)[number]

export interface Concept {
  readonly id: ConceptId
  /** As the player meets it: "file descriptor", "`|` pipe". */
  readonly term: string
  readonly part: ConceptPart
  readonly codex?: string
}

export interface ConceptCatalogue {
  readonly concepts: readonly Concept[]
}

export interface ConceptViolation {
  readonly kind: ConceptViolationKind
  readonly concept: ConceptId
  /** The level that uses it too early, teaches it again, or taught it with no level using it after. */
  readonly levelId: LevelId
  /** The level that teaches it later, or taught it first; null when there is none. */
  readonly other: LevelId | null
}
