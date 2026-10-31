import type { Validated } from '@kernelfall/core/types'
import type { LevelChecker, LevelCheckers } from '#types/definitions/checker'
import type { GameContent, GameContentParts } from '#types/definitions/content'
import type { FieldGuide } from '#types/definitions/field-guide'
import type { LevelDefinition, LevelId } from '#types/definitions/level'
import type { ActOutline } from '#types/definitions/outline'
import { levelChecker } from '#utils/checker/index'
import { validateSkillTree } from '#utils/skills/index'

/** Each level once, by id; a second definition of an id is reported. */
function indexLevels(levels: readonly LevelDefinition[], errors: string[]): ReadonlyMap<LevelId, LevelDefinition> {
  const byId = new Map<LevelId, LevelDefinition>()
  for (const level of levels) {
    if (byId.has(level.id)) {
      errors.push(`level "${level.id}" is defined more than once`)
    }
    byId.set(level.id, level)
  }
  return byId
}

/** Act and region ids repeat only where the outline allows: a region id once per act. */
function checkOutlineIds(acts: readonly ActOutline[], errors: string[]): void {
  const actIds = new Set<string>()
  for (const act of acts) {
    if (actIds.has(act.act)) {
      errors.push(`act "${act.act}" is in the outline more than once`)
    }
    actIds.add(act.act)
    const regionIds = new Set<string>()
    for (const region of act.regions) {
      if (regionIds.has(region.id)) {
        errors.push(`${act.act}: region "${region.id}" is in the outline more than once`)
      }
      regionIds.add(region.id)
    }
  }
}

/** Each placement task stands for a built level of its region, and lists objectives that level has. */
function checkPlacements(
  acts: readonly ActOutline[],
  byId: ReadonlyMap<LevelId, LevelDefinition>,
  errors: string[]
): void {
  for (const act of acts) {
    for (const region of act.regions) {
      const inRegion = new Set(region.slots.map((slot) => slot.levelId))
      for (const task of region.placement?.tasks ?? []) {
        const level = byId.get(task.levelId)
        if (!level || !inRegion.has(task.levelId)) {
          errors.push(`${act.act}/${region.id}: a placement task stands for "${task.levelId}", no level of the region`)
          continue
        }
        const ids = new Set(level.objectives.map((objective) => objective.id))
        for (const id of task.objectives.filter((objective) => !ids.has(objective))) {
          errors.push(`${act.act}/${region.id}: a placement task lists "${id}", which ${level.id} has no objective for`)
        }
      }
    }
  }
}

/** Every slot the Field Guide names is a slot of the outline, built or planned. */
function checkFieldGuide(guide: FieldGuide, acts: readonly ActOutline[], errors: string[]): void {
  const numbers = new Set(
    acts.flatMap((act) => act.regions.flatMap((region) => region.slots.map((slot) => slot.number)))
  )
  const unknown = (slot: string) => !numbers.has(slot)
  if (unknown(guide.opensAt)) {
    errors.push(`field guide: opens at "${guide.opensAt}", which is no slot of the outline`)
  }
  for (const entry of guide.entries) {
    for (const slot of [entry.firstMet, ...entry.deepenedIn].filter(unknown)) {
      errors.push(`field guide: ${entry.name} names "${slot}", which is no slot of the outline`)
    }
  }
}

/**
 * The built levels in the order the outline lists them. Every level sits in
 * exactly one slot, in the act and region it names.
 */
function playOrder(
  acts: readonly ActOutline[],
  byId: ReadonlyMap<LevelId, LevelDefinition>,
  errors: string[]
): LevelDefinition[] {
  const order: LevelDefinition[] = []
  for (const act of acts) {
    for (const region of act.regions) {
      for (const slot of region.slots) {
        if (slot.levelId === null) {
          continue
        }
        const level = byId.get(slot.levelId)
        if (!level) {
          errors.push(`${act.act}/${region.id}: slot ${slot.number} points at "${slot.levelId}", which is not a level`)
        } else if (order.includes(level)) {
          errors.push(`level "${level.id}" is in more than one slot`)
        } else if (level.act !== act.act || level.region !== region.id) {
          errors.push(`level "${level.id}" belongs to ${level.act}/${level.region} but sits in ${act.act}/${region.id}`)
        } else {
          order.push(level)
        }
      }
    }
  }
  for (const id of byId.keys()) {
    if (!order.some((level) => level.id === id)) {
      errors.push(`level "${id}" is not in any slot of the outline`)
    }
  }
  return order
}

/**
 * Builds each level's checker from its declared checks and its custom one. A
 * level that declares some checks but not all needs a custom checker for the rest.
 */
function buildCheckers(
  levels: readonly LevelDefinition[],
  custom: LevelCheckers,
  errors: string[]
): ReadonlyMap<LevelId, LevelChecker> {
  const checkers = new Map<LevelId, LevelChecker>()
  for (const id of Object.keys(custom)) {
    if (!levels.some((level) => level.id === id)) {
      errors.push(`a checker is registered for "${id}", which is not a level`)
    }
  }
  for (const level of levels) {
    const own = custom[level.id]
    const unchecked = level.objectives.filter((objective) => !objective.check)
    if (!own && unchecked.length > 0 && unchecked.length < level.objectives.length) {
      const ids = unchecked.map((objective) => `"${objective.id}"`).join(', ')
      errors.push(`level "${level.id}": objectives ${ids} have no check, and the level has no checker of its own`)
    }
    const checker = levelChecker(level, own)
    if (checker) {
      checkers.set(level.id, checker)
    }
  }
  return checkers
}

/**
 * Bundles the outline, its levels, the skill tree and the levels' checkers.
 * Reports duplicate levels, levels and slots that don't match, bad skill
 * references, checkers that are missing or belong to no level, and placement
 * tasks that name a level or objective the region doesn't have.
 */
export function createGameContent({
  acts,
  levels,
  skills,
  checkers = {},
  fieldGuide,
}: GameContentParts): Validated<GameContent> {
  const errors: string[] = []
  const byId = indexLevels(levels, errors)
  checkOutlineIds(acts, errors)
  checkPlacements(acts, byId, errors)
  if (fieldGuide) {
    checkFieldGuide(fieldGuide, acts, errors)
  }
  const ordered = playOrder(acts, byId, errors)
  errors.push(...validateSkillTree(skills, ordered))
  const checkerOf = buildCheckers(ordered, checkers, errors)
  if (errors.length > 0) {
    return { ok: false, errors }
  }
  return {
    ok: true,
    value: {
      acts,
      levels: ordered,
      skills,
      fieldGuide: fieldGuide ?? null,
      level: (id) => byId.get(id),
      checker: (id) => checkerOf.get(id),
    },
  }
}
