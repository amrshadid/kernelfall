import type { LevelDefinition, LevelId, SkillId } from '#types/definitions/level'
import type { SkillNode, SkillStatus } from '#types/definitions/skills'

/**
 * Checks the skill tree and the levels that point into it: duplicate ids,
 * prerequisites and level skills that don't exist, and prerequisite cycles.
 * Returns readable errors; empty means valid.
 */
export function validateSkillTree(
  nodes: readonly SkillNode[],
  levels: readonly LevelDefinition[] = []
): readonly string[] {
  const errors: string[] = []
  const known = new Set<SkillId>()
  for (const node of nodes) {
    if (known.has(node.id)) {
      errors.push(`skill "${node.id}" is defined more than once`)
    }
    known.add(node.id)
  }
  for (const node of nodes) {
    for (const id of node.prerequisites.filter((prerequisite) => !known.has(prerequisite))) {
      errors.push(`skill "${node.id}" requires unknown skill "${id}"`)
    }
  }
  for (const level of levels) {
    for (const id of [...level.skills, ...level.prerequisites].filter((s) => !known.has(s))) {
      errors.push(`level "${level.id}" refers to unknown skill "${id}"`)
    }
  }
  errors.push(...findCycles(nodes).map((cycle) => `prerequisite cycle: ${cycle.join(' → ')}`))
  return errors
}

type VisitState = 'visiting' | 'done'

/** Each cycle once, as a path that starts and ends on the same skill. */
function findCycles(nodes: readonly SkillNode[]): readonly (readonly SkillId[])[] {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const state = new Map<SkillId, VisitState>()
  const cycles: SkillId[][] = []

  const visit = (id: SkillId, path: readonly SkillId[]): void => {
    const seen = state.get(id)
    if (seen === 'visiting') {
      cycles.push([...path.slice(path.indexOf(id)), id])
      return
    }
    if (seen === 'done' || !byId.has(id)) {
      return
    }
    state.set(id, 'visiting')
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) {
      visit(prerequisite, [...path, id])
    }
    state.set(id, 'done')
  }

  for (const node of nodes) {
    visit(node.id, [])
  }
  return cycles
}

/** Skills unlocked by the completed levels. */
export function unlockedSkills(
  levels: readonly LevelDefinition[],
  completed: ReadonlySet<LevelId>
): ReadonlySet<SkillId> {
  return new Set(levels.filter((level) => completed.has(level.id)).flatMap((level) => level.skills))
}

/** Status of every node, given the skills unlocked so far. */
export function skillStatuses(
  nodes: readonly SkillNode[],
  unlocked: ReadonlySet<SkillId>
): ReadonlyMap<SkillId, SkillStatus> {
  return new Map(nodes.map((node) => [node.id, statusOf(node, unlocked)] as const))
}

function statusOf(node: SkillNode, unlocked: ReadonlySet<SkillId>): SkillStatus {
  if (unlocked.has(node.id)) {
    return 'unlocked'
  }
  return node.prerequisites.every((id) => unlocked.has(id)) ? 'available' : 'locked'
}

/** A level can be played once all its prerequisite skills are unlocked. */
export function isLevelPlayable(level: LevelDefinition, unlocked: ReadonlySet<SkillId>): boolean {
  return level.prerequisites.every((id) => unlocked.has(id))
}
