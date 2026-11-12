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
  SAY,
  YOUR_TERMINAL,
} from './crossing.constants'
import type { CallSay } from './crossing-calls.constants'
import { type CallWords, callWords, refusedText, routeText, sayValues } from './crossing-calls.util'

const PERMISSION_ERRNOS = ['EPERM', 'EACCES']
// A terminal's colour and cursor codes (CSI sequences): the screen acts on them and shows none.
const ESCAPES = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;?]*[A-Za-z]`, 'g')

/** What the trace knows about where the call went, beyond the call itself. */
export interface CrossingInput {
  /** The file or driver that served it, from its `sys_exit`. */
  readonly route?: CallRoute | undefined
  /** The file its fd was opened with earlier in the run. */
  readonly file?: string | null | undefined
}

/** What reached the screen, as the screen shows it. */
const onScreen = (text: string) => text.replaceAll(ESCAPES, '')

const writes = (call: XrayCall) => call.name === 'write' || call.name === 'writev'

/** Where a write's bytes go, in plain words, when the run says. */
function targetOf(call: XrayCall, file: string | null): string | null {
  if (call.console !== null) {
    return YOUR_TERMINAL
  }
  return file
}

/** The request in plain words: what the call asks for, and for a write, where its bytes go. */
export function requestText(call: XrayCall, file: string | null = null): string {
  const words = callWords(call)
  if (!words) {
    return call.desk
  }
  const request = fillTemplate(words.say.request, words.values)
  const target = writes(call) ? targetOf(call, file) : null
  return target === null ? request : `${request} (${target})`
}

/** The kernel's parts the call works in, from its syscall, its route and what reached the console. */
export function crossingParts(call: XrayCall, route?: CallRoute): readonly CrossingPart[] {
  const done = returnOf(call)
  const ids = [...(SYSCALL_PARTS[call.name] ?? [])]
  let served: SectionPartId | null = ids[0] ?? null
  // Without a route, the served part's detail is where the call's own handler lives.
  let servedDetail: string | null = call.sources[0]?.path ?? null
  if (route) {
    const reached =
      (route.kind === 'fs' ? FS_SECTION_PARTS[route.fs] : DRIVER_SECTION_PARTS[route.driver]) ??
      (route.kind === 'fs' ? ['vfs'] : ['drivers'])
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
  return [{ id: null, name: 'The kernel', detail: servedDetail ?? call.kernelPath.at(-1) ?? call.name, served: true }]
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

/** A guess from the call's CALL_SAY entry: its answer against the other options it names. */
function sayChoices(say: CallSay | null, value: string, fill: (text: string) => string): PredictChoices | null {
  return say?.predict ? numberChoices(value, say.predict.map(fill)) : null
}

/** What a call that came back means: the call's own words, else the content's, else that it worked. */
function meaningOf(call: XrayCall, say: CallSay | null, ret: number, fill: (text: string) => string): string {
  if (writes(call) && call.buffer) {
    return fill(ret < call.buffer.count ? MEANING.short : MEANING.full)
  }
  if (say) {
    return fill(ret === 0 && say.zero ? say.zero : say.meaning)
  }
  return call.returns ?? MEANING.worked
}

/** What comes back, the sentence that says it, and the guess before it; no guess where nothing comes back. */
function answerText(
  call: XrayCall,
  words: CallWords | null,
  narration: XrayNarration,
  values: TemplateValues
): AnswerText {
  const done = returnOf(call)
  const say = words?.say ?? null
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
  const write = call.name === 'write' && call.buffer !== null
  const writeExplain = String(values.writeExplain ?? '')
  if (done.errno !== null) {
    const choices = write ? writeChoices(call) : say ? sayChoices(say, '-1', fill) : numberChoices('-1', ['0'])
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
  const meaning = meaningOf(call, say, done.ret, fill)
  const said = fill(SAY.answer, { value, meaning })
  if (write) {
    return { answer: { value, meaning }, say: said, predict: predictOf(writeChoices(call), writeExplain) }
  }
  if (call.family === 'fork' && words?.key !== 'clone-thread') {
    const forkText = stageText(narration.syscallStages['answer-fork'], values, { predict: forkChoices(call) })
    return {
      answer: { value, meaning },
      say: said,
      predict: predictOf(forkChoices(call), forkText.predict?.explain ?? ''),
    }
  }
  const choices = say ? sayChoices(say, value, fill) : numberChoices(value, ['0', '-1'])
  return {
    answer: { value, meaning },
    say: said,
    predict: predictOf(choices, fill(PREDICT.explainWorked, { value, meaning })),
  }
}

/** The kernel beat's sentence: why it refused, or what it does, and where the route says it went. */
function kernelSay(
  call: XrayCall,
  words: CallWords | null,
  parts: readonly CrossingPart[],
  route: CallRoute | undefined,
  end: string | null,
  values: TemplateValues
): string {
  const say = words?.say ?? null
  if (returnOf(call)?.errno != null) {
    return fillTemplate(SAY.kernelFailed, { ...values, errnoMessage: refusedText(call, say, values) })
  }
  if (!say) {
    const served = parts.find((part) => part.served)
    const work = served?.id
      ? fillTemplate(SAY.kernelPart, { ...values, part: served.name })
      : fillTemplate(SAY.kernel, values)
    return work + (end ? fillTemplate(SAY.kernelEnd, { end }) : '')
  }
  const toTerminal = call.console !== null && say.console !== undefined
  const work = fillTemplate(toTerminal ? (say.console ?? '') : say.work, values)
  // The console sentence already names the tty driver the route would name.
  const routed = toTerminal && route?.kind === 'driver' ? null : routeText(call, route)
  return routed ? `${work} ${routed}` : work
}

/** One syscall at Simple: it asks, crosses the Gate, the kernel does it, the device shows it, the answer comes back. */
export function crossingStoryboard(
  call: XrayCall,
  narration: XrayNarration,
  { route, file = null }: CrossingInput = {}
): CrossingStoryboard {
  const done = returnOf(call)
  const words = callWords(call)
  const values: TemplateValues = {
    ...syscallValues(call, narration.parts),
    desk: lowerFirst(call.desk),
    target: targetOf(call, file) ?? `the file behind fd ${call.args[0]?.value ?? '?'}`,
    newProgram: baseName(call.path ?? call.program),
    printed: shownText(onScreen(call.console ?? '')),
    ...(words?.values ?? sayValues(call)),
  }
  const fill = (text: string) => fillTemplate(text, values)
  const parts = crossingParts(call, route)
  const end = route ? routeRowOf(call, route, file).end : null
  const answer = answerText(call, words, narration, values)
  const terminal = call.console !== null && done?.errno == null ? onScreen(call.console) : null

  const ask = words ? words.say.ask : SAY.ask
  const beats: { beat: CrossingBeat; say: string; predict?: StagePredict | undefined }[] = [
    { beat: 'ask', say: fill(ask) },
    { beat: 'gate', say: SAY.gate },
    { beat: 'kernel', say: kernelSay(call, words, parts, route, end, values) },
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
