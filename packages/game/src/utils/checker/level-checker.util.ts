import type { CheckInput, CheckReport, LevelChecker } from '#types/definitions/checker'
import type { ProgramScope } from '#types/definitions/checks'
import type { LevelDefinition } from '#types/definitions/level'
import type { TaintEvent } from '#types/definitions/taint'
import { meetsObjectiveCheck } from '#utils/checker/objective-checks.util'
import { findTaint } from '#utils/checker/taint-checks.util'
import { judgedProcesses } from '#utils/queries/index'

/**
 * The custom logic of a level, in its own `checker.ts`: the objectives and Taint
 * rules its `level.yaml` can't declare. It reports them by id, like the engine does.
 */
export const defineChecker = (checker: LevelChecker): LevelChecker => checker

/** The scopes of a level's declared checks: whose processes they judge. */
function scopesOf(level: LevelDefinition): readonly ProgramScope[] {
  const checks = [...level.objectives, ...level.taint].flatMap((entry) => (entry.check ? [entry.check] : []))
  const programs = new Set(checks.map((check) => ('program' in check ? check.program : undefined)))
  return [...programs].map((program) => (program === undefined ? {} : { program }))
}

/** What the level's declared checks report for one command. */
function declaredReport(level: LevelDefinition, input: CheckInput): CheckReport {
  const objectivesMet = level.objectives.flatMap((objective) =>
    objective.check && meetsObjectiveCheck(objective.check, input) ? [objective.id] : []
  )
  const taint = level.taint.flatMap((rule): TaintEvent[] =>
    rule.check ? findTaint(rule.check, input).map((finding) => ({ ruleId: rule.id, ...finding })) : []
  )
  return { objectivesMet, taint }
}

/**
 * A level's whole checker: its declared checks, judged by the engine, plus its
 * own `checker.ts` if it has one. A command is judged when it ran a process a
 * declared check judges, or when the custom checker says it applies. Undefined
 * for a level with neither: only init's version finishes it.
 */
export function levelChecker(level: LevelDefinition, custom?: LevelChecker): LevelChecker | undefined {
  const declared = scopesOf(level)
  if (!custom && declared.length === 0) {
    return undefined
  }
  // A custom checker alone judges the player's programs unless it says otherwise.
  const scopes = declared.length === 0 && !custom?.applies ? [{}] : declared
  return {
    applies: (input) =>
      scopes.some((scope) => judgedProcesses(input.events, scope).length > 0) || (custom?.applies?.(input) ?? false),
    check: (input) => {
      const engine = declaredReport(level, input)
      const own = custom?.check(input) ?? { objectivesMet: [], taint: [] }
      return {
        objectivesMet: [...new Set([...engine.objectivesMet, ...own.objectivesMet])],
        taint: [...engine.taint, ...own.taint],
      }
    },
  }
}
