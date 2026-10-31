import type { CallFocus, CallFocusRule, XrayCall } from '@features/xray/types'
import { baseName } from '@features/xray/utils/calls'
import type { LevelDefinition, ObjectiveCheck, TaintCheck } from '@kernelfall/game/types'
import { CHECK_CALLS } from './call-list.constants'

const NO_FOCUS: CallFocus = []

function ruleOf(check: ObjectiveCheck | TaintCheck): CallFocusRule | null {
  const program = 'program' in check ? check.program : undefined
  const scope = program !== undefined ? { program } : {}
  if (check.kind === 'syscall') {
    return { names: check.names, ...scope }
  }
  const names = CHECK_CALLS[check.kind]
  if (!names) {
    return null
  }
  // A program that must exit with a status is watched to its exit_group too.
  const withExit = check.kind === 'ran' && check.status !== undefined ? [...names, 'exit_group'] : names
  return { names: withExit, ...scope }
}

/** The calls a level teaches, from the checks it declares; a level judged only by its own checker has none. */
export function callFocusOf(level: Pick<LevelDefinition, 'objectives' | 'taint' | 'xrayFocus'> | null): CallFocus {
  const checks = level ? [...level.objectives, ...level.taint].map((item) => item.check) : []
  const rules = checks.flatMap((check) => {
    const rule = check ? ruleOf(check) : null
    return rule ? [rule] : []
  })
  const declared = level?.xrayFocus?.length ? [{ names: level.xrayFocus }] : []
  const all = [...rules, ...declared]
  return all.length > 0 ? all : NO_FOCUS
}

/** `program` is the process's program when the run ended; an execve counts for the program it starts. */
export function isFocusedCall(call: XrayCall, program: string, focus: CallFocus): boolean {
  return focus.some(
    (rule) =>
      rule.names.includes(call.name) &&
      (rule.program === undefined ||
        rule.program === call.program ||
        rule.program === program ||
        (call.name === 'execve' && call.path !== null && baseName(call.path) === rule.program))
  )
}
