import type { CheckInput, CheckVerdict, LevelChecker } from '#types/definitions/checker'
import type { LevelDefinition } from '#types/definitions/level'
import type { TaintEntry, TaintEvent } from '#types/definitions/taint'

/**
 * Runs a level's checker and judges its report.
 *
 * @throws Error if the checker names an objective or Taint rule the level doesn't
 * define. That is a bug in the level, not something the player did.
 */
export function evaluateCheck(level: LevelDefinition, checker: LevelChecker, input: CheckInput): CheckVerdict {
  const report = checker.check(input)
  const objectiveIds = new Set(level.objectives.map((objective) => objective.id))
  for (const id of report.objectivesMet) {
    if (!objectiveIds.has(id)) {
      throw new Error(`${level.id}: checker reported unknown objective "${id}"`)
    }
  }
  priceTaint(level, report.taint)
  const met = new Set(report.objectivesMet)
  const missing = level.objectives.filter((objective) => !met.has(objective.id))
  return { passed: missing.length === 0, missing, taint: report.taint }
}

/**
 * Turns Taint events into ledger entries using the level's rule points.
 *
 * @throws Error for a rule the level doesn't define (a bug in the level).
 */
export function priceTaint(level: LevelDefinition, events: readonly TaintEvent[]): readonly TaintEntry[] {
  return events.map((event) => {
    const rule = level.taint.find((candidate) => candidate.id === event.ruleId)
    if (!rule) {
      throw new Error(`${level.id}: checker reported unknown Taint rule "${event.ruleId}"`)
    }
    return {
      levelId: level.id,
      ruleId: rule.id,
      kind: rule.kind,
      points: rule.points,
      detail: event.detail,
    }
  })
}
