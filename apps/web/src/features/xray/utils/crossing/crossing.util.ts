import type {
  CrossingAnswer,
  CrossingBeat,
  CrossingPart,
  CrossingScene,
  CrossingStoryboard,
  PredictChoices,
  SectionPartId,
  Stage,
  StagePredict,
  XrayCall,
} from '@features/xray/types'
import { baseName } from '@features/xray/utils/calls'
import { lowerFirst, shownText, stageText } from '@features/xray/utils/narration'
import { routeRowOf } from '@features/xray/utils/route'
import { DRIVER_SECTION_PARTS, FS_SECTION_PARTS, SECTION_PARTS, SYSCALL_PARTS } from '@features/xray/utils/section'
import { forkChoices, returnOf, syscallValues, writeChoices } from '@features/xray/utils/syscalls'
import type { TemplateValues, XrayNarration } from '@kernelfall/levels/types'
import { fillTemplate } from '@kernelfall/levels/utils'
import type { CallRoute } from '@kernelfall/machine/types'
import {
  BEAT_HEADS,
  CONSOLE_DRIVER,
  MAX_PARTS,
  MEANING,
  NO_ANSWER,
  PREDICT,
  REQUEST,
  SAY,
  YOUR_TERMINAL,
} from './crossing.constants'

const PERMISSION_ERRNOS = ['EPERM', 'EACCES']

/** What the trace knows about where the call went, beyond the call itself. */
export interface CrossingInput {
  /** The file or driver that served it, from its `sys_exit`. */
  readonly route?: CallRoute | undefined
  /** The file its fd was opened with earlier in the run. */
  readonly file?: string | null | undefined
}

const fdOf = (call: XrayCall) => call.args[0]?.value ?? '?'

/** Where a write's bytes go, in plain words, when the run says. */
function targetOf(call: XrayCall, file: string | null): string | null {
  if (call.console !== null) {
    return YOUR_TERMINAL
  }
  return file
}

/** The request in plain words: a write or read by its numbers, any other call by what it does. */
export function requestText(call: XrayCall, file: string | null = null): string {
  const values = { count: call.buffer?.count ?? call.args[2]?.value ?? '?', fd: fdOf(call) }
  if (call.family === 'write') {
    const target = targetOf(call, file)
    return fillTemplate(target === null ? REQUEST.write : REQUEST.writeTo, { ...values, target: target ?? '' })
  }
  if (call.name === 'read') {
    return fillTemplate(REQUEST.read, values)
  }
  return call.desk
}

/** The kernel's parts the call works in, from its syscall, its route and what reached the console. */
export function crossingParts(call: XrayCall, route?: CallRoute): readonly CrossingPart[] {
  const done = returnOf(call)
  const ids = [...(SYSCALL_PARTS[call.name] ?? [])]
  let served: SectionPartId | null = ids[0] ?? null
  let servedDetail: string | null = null
  if (route) {
    const reached = (route.kind === 'fs' ? FS_SECTION_PARTS[route.fs] : DRIVER_SECTION_PARTS[route.driver]) ?? [
      'drivers',
    ]
    const kernel = reached.filter((id) => SECTION_PARTS.some((p) => p.id === id && p.floor === 'kernel'))
    ids.push(...kernel)
    served = kernel[0] ?? served
    servedDetail = routeRowOf(call, route, null).part.name
  } else if (call.console !== null && done?.errno == null) {
    ids.push('drivers')
    served = 'drivers'
    servedDetail = CONSOLE_DRIVER
  }
  if (done?.errno != null && PERMISSION_ERRNOS.includes(done.errno)) {
    ids.push('security')
    served = 'security'
    servedDetail = null
  }
  const parts = [...new Set(ids)].slice(0, MAX_PARTS).flatMap((id) => {
    const part = SECTION_PARTS.find((p) => p.id === id && p.floor === 'kernel' && p.id !== 'syscalls')
    if (!part) {
      return []
    }
    const detail = id === served && servedDetail !== null ? servedDetail : (part.source.split(',')[0] ?? '')
    return [{ id, name: part.name, detail, served: id === served }]
  })
  if (parts.length > 0) {
    return parts
  }
  return [{ id: null, name: 'The kernel', detail: call.kernelPath.at(-1) ?? call.name, served: true }]
}

interface AnswerText {
  readonly answer: CrossingAnswer
  readonly say: string
  readonly predict: StagePredict | undefined
}

/** Numbers first, ascending, without repeats. */
function numberChoices(answer: string, others: readonly string[]): PredictChoices {
  const options = [...new Set([answer, ...others])].sort((a, b) => Number(a) - Number(b))
  return { answer, options }
}

function predictOf(choices: PredictChoices | null, explain: string): StagePredict | undefined {
  return choices ? { question: PREDICT.question, ...choices, explain } : undefined
}

/** What comes back, the sentence that says it, and the guess before it; no guess where nothing comes back. */
function answerText(call: XrayCall, narration: XrayNarration, values: TemplateValues): AnswerText {
  const done = returnOf(call)
  const fill = (text: string, extra: TemplateValues = {}) => fillTemplate(text, { ...values, ...extra })
  if (!done) {
    const pending = call.outcome.kind === 'pending'
    if (call.family === 'exit' && !pending) {
      return { answer: { value: NO_ANSWER, meaning: MEANING.exit }, say: SAY.answerExit, predict: undefined }
    }
    return {
      answer: { value: NO_ANSWER, meaning: pending ? MEANING.pending : MEANING.killed },
      say: pending ? SAY.answerPending : SAY.answerKilled,
      predict: undefined,
    }
  }
  const write = call.family === 'write'
  const writeExplain = String(values.writeExplain ?? '')
  if (done.errno !== null) {
    const choices = write ? writeChoices(call) : numberChoices('-1', ['0'])
    return {
      answer: { value: '-1', meaning: done.errno },
      say: fill(SAY.answerFailed),
      predict: predictOf(choices, write ? writeExplain : fill(PREDICT.explainFailed)),
    }
  }
  if (call.family === 'execve') {
    return { answer: { value: NO_ANSWER, meaning: fill(MEANING.exec) }, say: fill(SAY.answerExec), predict: undefined }
  }
  const value = String(done.toProgram)
  if (write && call.buffer) {
    const meaning = fill(done.ret < call.buffer.count ? MEANING.short : MEANING.full)
    return {
      answer: { value, meaning },
      say: fill(SAY.answer, { value, meaning }),
      predict: predictOf(writeChoices(call), writeExplain),
    }
  }
  if (call.family === 'fork') {
    const forkText = stageText(narration.syscallStages['answer-fork'], values, { predict: forkChoices(call) })
    return {
      answer: { value, meaning: MEANING.fork },
      say: fill(SAY.answer, { value, meaning: MEANING.fork }),
      predict: predictOf(forkChoices(call), forkText.predict?.explain ?? ''),
    }
  }
  const meaning = call.returns ?? MEANING.worked
  return {
    answer: { value, meaning },
    say: fill(SAY.answer, { value, meaning }),
    predict: predictOf(numberChoices(value, ['0', '-1']), fill(PREDICT.explainWorked, { value, meaning })),
  }
}

/** The kernel beat's sentence: a failure, the console's driver, or the part that does the work. */
function kernelSay(call: XrayCall, parts: readonly CrossingPart[], end: string | null, values: TemplateValues) {
  if (returnOf(call)?.errno != null) {
    return fillTemplate(SAY.kernelFailed, values)
  }
  if (call.family === 'write' && call.console !== null) {
    return fillTemplate(SAY.kernelConsole, values)
  }
  const served = parts.find((part) => part.served)
  const work = served?.id
    ? fillTemplate(SAY.kernelPart, { ...values, part: served.name })
    : fillTemplate(SAY.kernel, values)
  return work + (end ? fillTemplate(SAY.kernelEnd, { end }) : '')
}

/** One syscall at Simple: it asks, crosses the Gate, the kernel does it, the device shows it, the answer comes back. */
export function crossingStoryboard(
  call: XrayCall,
  narration: XrayNarration,
  { route, file = null }: CrossingInput = {}
): CrossingStoryboard {
  const done = returnOf(call)
  const values: TemplateValues = {
    ...syscallValues(call, narration.parts),
    desk: lowerFirst(call.desk),
    target: targetOf(call, file) ?? 'a file',
    newProgram: baseName(call.path ?? call.program),
    printed: shownText(call.console ?? ''),
  }
  const fill = (text: string) => fillTemplate(text, values)
  const parts = crossingParts(call, route)
  const end = route ? routeRowOf(call, route, file).end : null
  const answer = answerText(call, narration, values)
  const terminal = call.family === 'write' && call.console !== null && done?.errno == null ? call.console : null

  const ask = call.family === 'write' ? SAY.askWrite : call.name === 'read' ? SAY.askRead : SAY.ask
  const beats: { beat: CrossingBeat; say: string; predict?: StagePredict | undefined }[] = [
    { beat: 'ask', say: fill(ask) },
    { beat: 'gate', say: SAY.gate },
    { beat: 'kernel', say: kernelSay(call, parts, end, values) },
    ...(terminal !== null ? [{ beat: 'device' as const, say: fill(SAY.device) }] : []),
    { beat: 'answer', say: answer.say, predict: answer.predict },
  ]

  const stages: Stage<CrossingScene>[] = beats.map(({ beat, say, predict }) => ({
    key: beat,
    tick: BEAT_HEADS[beat].tick,
    title: fill(BEAT_HEADS[beat].title),
    what: say,
    why: '',
    deeper: '',
    sources: call.sources,
    ...(predict && { predict }),
    scene: { beat },
  }))

  return {
    key: `crossing:${call.id}`,
    call,
    request: requestText(call, file),
    parts,
    terminal,
    answer: answer.answer,
    stages,
  }
}
