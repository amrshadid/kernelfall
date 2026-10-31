import type { PredictChoices, XrayCall } from '@features/xray/types'
import { baseName } from '@features/xray/utils/calls'
import { code, errnoMessage, lowerFirst, shownText } from '@features/xray/utils/narration'
import type { TemplateValues, XrayNarration } from '@kernelfall/levels/types'
import { fillTemplate } from '@kernelfall/levels/utils'

/** A guess offers at most this many options. */
const MAX_OPTIONS = 4

export const returnOf = (call: XrayCall) => (call.outcome.kind === 'returned' ? call.outcome : null)

/** The distinct options of a guess, always including the answer, in a stable order: numbers first, ascending. */
function choicesOf(answer: string, others: readonly string[]): PredictChoices {
  const options = [...new Set([answer, ...others])].slice(0, MAX_OPTIONS)
  return { answer, options: options.sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)) }
}

/** What write() can plausibly return here: the count, nothing, the fd (a common mix-up), -1, or one byte short. */
export function writeChoices(call: XrayCall): PredictChoices | null {
  const done = returnOf(call)
  if (!done || !call.buffer) {
    return null
  }
  const fd = call.args[0]?.value ?? '1'
  const count = call.buffer.count
  return choicesOf(String(done.toProgram), [String(count), '0', fd, '-1', String(Math.max(count - 1, 0))])
}

/** What fork() returns in the parent, against the child's 0, the parent's own PID and failure. */
export function forkChoices(call: XrayCall): PredictChoices | null {
  const done = returnOf(call)
  if (!done || done.errno !== null) {
    return null
  }
  return choicesOf(String(done.ret), ['0', String(call.pid), '-1'])
}

/** Worked out once per call. */
export function syscallValues(call: XrayCall, parts: XrayNarration['parts']): TemplateValues {
  const done = returnOf(call)
  const count = call.buffer?.count ?? 0
  const values = {
    name: call.name,
    nr: call.nr,
    program: call.program,
    pid: call.pid,
    text: call.text,
    fd: call.args[0]?.value ?? '?',
    status: call.args[0]?.value ?? '0',
    count,
    address: call.buffer?.address ?? 'buf',
    ret: done?.ret ?? '?',
    child: done?.ret ?? '?',
    errno: done?.errno ?? '',
    errnoMessage: errnoMessage(done?.errno ?? null),
    toProgram: done?.toProgram ?? '?',
    path: call.path ?? 'the program',
    newProgram: baseName(call.path ?? 'the program'),
    execProgram: baseName(call.path ?? call.program),
    printed: shownText(call.console ?? ''),
    firstFn: call.kernelPath[0] ?? call.name,
    lastFn: call.kernelPath.at(-1) ?? 'work',
    deskLower: lowerFirst(call.desk),
    callPath: call.kernelPath.map(code).join(' → '),
    returns: call.returns ?? '',
  }
  const part = (key: keyof XrayNarration['parts'], extra: TemplateValues = {}) =>
    fillTemplate(parts[key], { ...values, ...extra })
  const list = call.args.map((arg) => part('argument', { register: arg.register, arg: arg.name, value: arg.value }))
  const meaning =
    call.family === 'wait' && done?.ret === 0
      ? part('wait-none-meaning')
      : call.returns !== null
        ? part('return-meaning')
        : ''
  const shortWrite =
    call.family === 'write' && call.buffer !== null && done !== null && done.errno === null && done.ret < count
  const writeExplain =
    done?.errno != null ? 'write-predict-error' : done?.ret === count ? 'write-predict-full' : 'write-predict-short'
  return {
    ...values,
    whyAsk: part(`why-ask-${call.family}`),
    cloneNote: call.name === 'clone' ? part('clone-note') : '',
    arguments: list.length > 0 ? part('arguments', { list: list.join(', ') }) : part('no-arguments'),
    bufferNote: call.buffer ? part('buffer-stays') : '',
    rlimit: done?.errno === 'EAGAIN' ? part('rlimit-nproc') : '',
    groupExit: call.name === 'exit_group' ? part('group-exit') : '',
    meaning,
    shortWrite: shortWrite ? part('short-write') : '',
    writeExplain: part(writeExplain),
  }
}
