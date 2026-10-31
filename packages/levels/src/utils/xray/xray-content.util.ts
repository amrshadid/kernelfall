import type { Validated } from '@kernelfall/game/types'
import { describeType, Issues, isRecord, joinPath, ObjectReader } from '@kernelfall/game/utils'
import { parse } from 'yaml'
import {
  NARRATION_PART_KEYS,
  PROCESS_STAGE_KEYS,
  SYSCALL_DESK_KEYS,
  SYSCALL_STAGE_KEYS,
  XRAY_CALL_FAMILIES,
  type XrayContent,
  type XrayContentFiles,
  type XrayDesk,
  type XrayNarration,
  type XrayPredictText,
  type XraySource,
  type XrayStageText,
  type XraySyscall,
} from '#types/index'

const SYSCALL_FIELDS = ['family', 'args', 'pointers', 'pathArg', 'path', 'sources', 'desk', 'returns'] as const
const NARRATION_FIELDS = ['parts', 'desks', 'syscall-stages', 'process-stages'] as const
const STAGE_FIELDS = [
  'tick',
  'title',
  'what',
  'why',
  'deeper',
  'gate',
  'simplified',
  'sources',
  'predict',
  'now',
] as const
const SOURCE_FIELDS = ['path', 'fn'] as const
const PREDICT_FIELDS = ['question', 'explain', 'answer', 'options'] as const
const DESK_FIELDS = ['fn', 'say', 'file'] as const
const NOW_FIELDS = ['fn', 'file'] as const

/** x86-64 passes at most six syscall arguments in registers. */
const MAX_SYSCALL_ARGS = 6
/** A syscall's name as the kernel's table writes it: lowercase, digits and underscores. */
const SYSCALL_NAME = /^[a-z][a-z0-9_]*$/

/** Stands for a file that didn't parse: its one error is reported, and nothing more about it. */
const UNPARSED = Symbol('unparsed')

/** Reads a YAML file, reporting a parse error with the file's name instead of throwing. */
function parseYaml(text: string, file: string, issues: Issues): unknown {
  try {
    return parse(text)
  } catch (error) {
    issues.add(file, `not valid YAML (${error instanceof Error ? error.message : String(error)})`)
    return UNPARSED
  }
}

function readSource(value: unknown, path: string, issues: Issues): XraySource {
  const source = new ObjectReader(value, path, issues)
  source.rejectUnknownKeys(SOURCE_FIELDS)
  return { path: source.string('path'), ...(source.has('fn') && { fn: source.string('fn') }) }
}

/** A list of argument positions, each a register slot that exists. */
function readArgIndexes(reader: ObjectReader, key: string): readonly number[] {
  return reader.list(key, (value, path) => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= MAX_SYSCALL_ARGS) {
      reader.issues.add(
        path,
        `expected an argument position from 0 to ${MAX_SYSCALL_ARGS - 1}, got ${describeType(value)}`
      )
      return 0
    }
    return value
  })
}

function readSyscall(name: string, value: unknown, path: string, issues: Issues): XraySyscall {
  if (!SYSCALL_NAME.test(name)) {
    issues.add(path, `expected a syscall name like wait4, got "${name}"`)
  }
  const call = new ObjectReader(value, path, issues)
  call.rejectUnknownKeys(SYSCALL_FIELDS)
  const args = call.stringList('args')
  if (args.length > MAX_SYSCALL_ARGS) {
    issues.add(call.pathOf('args'), `expected at most ${MAX_SYSCALL_ARGS} arguments, got ${args.length}`)
  }
  const pointers = call.has('pointers') ? readArgIndexes(call, 'pointers') : []
  const pathArg = call.has('pathArg') ? call.integer('pathArg', 0, MAX_SYSCALL_ARGS - 1) : null
  for (const index of [...pointers, ...(pathArg === null ? [] : [pathArg])]) {
    if (index >= args.length) {
      issues.add(path, `argument ${index} is named, but the call has only ${args.length} arguments`)
    }
  }
  return {
    name,
    family: call.has('family') ? call.oneOf('family', XRAY_CALL_FAMILIES) : 'generic',
    args,
    pointers,
    pathArg,
    path: call.stringList('path'),
    sources: call.list('sources', (source, at) => readSource(source, at, issues)),
    desk: call.string('desk'),
    returns: call.has('returns') ? call.string('returns') : null,
  }
}

function readSyscalls(input: unknown, issues: Issues): ReadonlyMap<string, XraySyscall> {
  const syscalls = new Map<string, XraySyscall>()
  if (!isRecord(input)) {
    issues.add('syscalls.yaml', `expected syscalls by name, got ${describeType(input)}`)
    return syscalls
  }
  for (const [name, value] of Object.entries(input)) {
    syscalls.set(name, readSyscall(name, value, joinPath('syscalls.yaml', name), issues))
  }
  return syscalls
}

function readPredict(predict: ObjectReader): XrayPredictText {
  predict.rejectUnknownKeys(PREDICT_FIELDS)
  return {
    question: predict.string('question'),
    explain: predict.string('explain'),
    ...(predict.has('answer') && { answer: predict.string('answer') }),
    ...(predict.has('options') && { options: predict.stringList('options') }),
  }
}

function readStage(stage: ObjectReader): XrayStageText {
  stage.rejectUnknownKeys(STAGE_FIELDS)
  const optional = (key: string) => (stage.has(key) ? { [key]: stage.string(key) } : {})
  const now = stage.has('now') ? stage.object('now') : null
  now?.rejectUnknownKeys(NOW_FIELDS)
  return {
    tick: stage.string('tick'),
    title: stage.string('title'),
    what: stage.string('what'),
    why: stage.string('why'),
    deeper: stage.string('deeper'),
    ...optional('gate'),
    ...optional('simplified'),
    ...(stage.has('sources') && {
      sources: stage.list('sources', (source, at) => readSource(source, at, stage.issues)),
    }),
    ...(stage.has('predict') && { predict: readPredict(stage.object('predict')) }),
    ...(now && { now: { fn: now.string('fn'), file: now.string('file') } }),
  }
}

function readDesk(desk: ObjectReader): XrayDesk {
  desk.rejectUnknownKeys(DESK_FIELDS)
  // Before the call reaches the kernel there is no function or file to name.
  return { fn: desk.string('fn'), say: desk.string('say'), file: desk.text('file') }
}

/** Every key of `keys` read from `group`, and nothing else: a missing stage would leave a hole in a storyboard. */
function readAll<K extends string, T>(
  group: ObjectReader,
  keys: readonly K[],
  read: (entry: ObjectReader) => T
): Readonly<Record<K, T>> {
  group.rejectUnknownKeys(keys)
  return Object.fromEntries(
    keys.map((key) => {
      if (group.has(key)) {
        return [key, read(group.object(key))]
      }
      group.issues.add(group.pathOf(key), 'missing: every storyboard that reaches this stage needs it')
      // A stand-in, read without reporting, so the one missing key is the only error.
      return [key, read(new ObjectReader({}, '', new Issues()))]
    })
  ) as Record<K, T>
}

function readNarration(input: unknown, issues: Issues): XrayNarration {
  const narration = new ObjectReader(input, 'narration.yaml', issues)
  narration.rejectUnknownKeys(NARRATION_FIELDS)
  const parts = narration.object('parts')
  parts.rejectUnknownKeys(NARRATION_PART_KEYS)
  return {
    // Fragments may be a lone punctuation mark and a space, so only their presence is checked.
    parts: Object.fromEntries(NARRATION_PART_KEYS.map((key) => [key, parts.text(key)])) as XrayNarration['parts'],
    desks: readAll(narration.object('desks'), SYSCALL_DESK_KEYS, readDesk),
    syscallStages: readAll(narration.object('syscall-stages'), SYSCALL_STAGE_KEYS, readStage),
    processStages: readAll(narration.object('process-stages'), PROCESS_STAGE_KEYS, readStage),
  }
}

/** Parses and checks X-ray's two content files, reporting every problem at once. */
export function loadXrayContent(files: XrayContentFiles): Validated<XrayContent> {
  const issues = new Issues()
  // A file that didn't parse is read against throwaway issues: its parse error says it all.
  const readerFor = (input: unknown) => (input === UNPARSED ? new Issues() : issues)
  const syscallsInput = parseYaml(files.syscalls, 'syscalls.yaml', issues)
  const narrationInput = parseYaml(files.narration, 'narration.yaml', issues)
  const syscalls = readSyscalls(syscallsInput, readerFor(syscallsInput))
  const narration = readNarration(narrationInput, readerFor(narrationInput))
  return issues.result({ syscalls, narration })
}
