import type { ConceptId, ConceptViolation } from '#types/definitions/concepts'
import type { LevelDefinition, LevelId } from '#types/definitions/level'

/**
 * Walks the levels in play order and reports every break in the chain of concepts:
 * a concept used before any level teaches it, a concept taught by a second level,
 * and a Prologue concept (the Survey included) that no later level uses or teaches again.
 */
export function conceptChain(levels: readonly LevelDefinition[]): ConceptViolation[] {
  const violations: ConceptViolation[] = []
  const teacherOf = new Map<ConceptId, LevelId>()
  const lastSeen = new Map<ConceptId, number>()
  levels.forEach((level, at) => {
    for (const concept of level.teaches ?? []) {
      teacherOf.set(concept, teacherOf.get(concept) ?? level.id)
    }
    for (const concept of [...(level.teaches ?? []), ...(level.uses ?? [])]) {
      lastSeen.set(concept, at)
    }
  })

  const taught = new Set<ConceptId>()
  levels.forEach((level, at) => {
    for (const concept of level.uses ?? []) {
      if (!taught.has(concept)) {
        violations.push({
          kind: 'used-before-taught',
          concept,
          levelId: level.id,
          other: teacherOf.get(concept) ?? null,
        })
      }
    }
    for (const concept of level.teaches ?? []) {
      if (taught.has(concept)) {
        violations.push({ kind: 'taught-twice', concept, levelId: level.id, other: teacherOf.get(concept) ?? null })
        continue
      }
      taught.add(concept)
      if (level.act === 'prologue' && lastSeen.get(concept) === at) {
        violations.push({ kind: 'never-used-again', concept, levelId: level.id, other: null })
      }
    }
  })
  return violations
}
