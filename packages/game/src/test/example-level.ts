import type { LabEvent, LabEventInit } from '@kernelfall/machine/events'
import { syscallNr } from '#test/lab-events'
import type { LevelChecker, LevelCheckers } from '#types/definitions/checker'
import type { GameContent } from '#types/definitions/content'
import type { LevelDefinition, LevelLocation } from '#types/definitions/level'
import type { ActOutline, MapLayerText } from '#types/definitions/outline'
import type { SkillNode } from '#types/definitions/skills'
import type { TaintEvent } from '#types/definitions/taint'
import { createGameContent } from '#utils/content/index'
import { validateLevel } from '#utils/validate/index'

/** Where the example levels' folders put them. */
export const EXAMPLE_LOCATION: LevelLocation = { act: 'act1', region: 'compilers-quarter' }

/** A parsed `level.yaml` that uses every field of the schema. */
export const EXAMPLE_LEVEL_YAML = {
  id: 'act1-compilers-quarter-01-hello-write',
  title: 'A Voice in the Quarter',
  tracks: ['c', 'userland'],
  skills: ['write-to-stdout'],
  prerequisites: [],
  objectives: [
    { id: 'prints-hello', text: 'Your program prints hello to the console.' },
    { id: 'exits-cleanly', text: 'Your program exits with status 0.' },
  ],
  hints: [
    'Which file descriptor does the console already have open for you?',
    'write(2) takes a file descriptor, a buffer and a length, and returns bytes written or -1.',
    'Look at the line where main() returns: what did write() tell you just before it?',
  ],
  xray: ['syscalls'],
  codex: [
    {
      id: 'write-syscall',
      term: 'write(2)',
      summary: 'Asks the kernel to copy bytes from your buffer to an open file descriptor.',
      sources: ['fs/read_write.c'],
      docs: 'https://man7.org/linux/man-pages/man2/write.2.html',
      tryIt: 'strace -e trace=write echo hello',
    },
  ],
  taint: [
    {
      id: 'ignored-write-error',
      kind: 'ignored_error',
      points: 2,
      description: 'write() failed and the program still exited with status 0.',
    },
  ],
  fidelity: {
    faithful: ['write(2) return values and errno', 'the i386 syscall number of write'],
    simplified: ['the console is a single tty with no line discipline'],
  },
  story: {
    scene: 'story.md#scene',
    debrief: 'story.md#debrief',
    realWorld: 'story.md#real-world',
  },
} as const

/** The example `level.yaml` with `fields` changed, validated in `location`; throws if it doesn't validate. */
export function exampleLevel(
  fields: Readonly<Record<string, unknown>> = {},
  location: LevelLocation = EXAMPLE_LOCATION
): LevelDefinition {
  const result = validateLevel({ ...EXAMPLE_LEVEL_YAML, ...fields }, location)
  if (!result.ok) {
    throw new Error(result.errors.join('\n'))
  }
  return result.value
}

export const EXAMPLE_LEVEL: LevelDefinition = exampleLevel()

/** A second level that needs the first one's skill, for unlock and status tests. */
export const FOLLOW_UP_LEVEL: LevelDefinition = exampleLevel({
  id: 'act1-compilers-quarter-02-exit-codes',
  title: 'Saying Goodbye',
  skills: ['exit-status'],
  prerequisites: ['write-to-stdout'],
  codex: [{ ...EXAMPLE_LEVEL_YAML.codex[0], id: 'exit-status', term: 'exit status' }],
})

export const EXAMPLE_SKILLS: readonly SkillNode[] = [
  {
    id: 'write-to-stdout',
    title: 'Print with write()',
    region: 'compilers-quarter',
    prerequisites: [],
  },
  {
    id: 'exit-status',
    title: 'Report success with an exit status',
    region: 'compilers-quarter',
    prerequisites: ['write-to-stdout'],
  },
]

/** A map layer with placeholder text, for outlines built in tests. */
export const exampleLayer = (key: string): MapLayerText => ({
  key,
  name: key,
  short: key,
  kicker: `${key} kicker`,
  caption: `${key} caption`,
  note: `${key} note`,
  source: 'kernel/',
  guides: 'init',
})

/** An outline that places `levels`, in order: one act per act, one region per region, one slot per level. */
export function exampleOutline(levels: readonly LevelDefinition[]): readonly ActOutline[] {
  const unique = <T>(values: readonly T[]): T[] => [...new Set(values)]
  return unique(levels.map((level) => level.act)).map((act): ActOutline => {
    const inAct = levels.filter((level) => level.act === act)
    const layer = exampleLayer(act)
    return {
      act,
      name: act,
      layer,
      regions: unique(inAct.map((level) => level.region)).map((id) => ({
        id,
        name: id,
        boss: false,
        caption: `${id} caption`,
        source: 'kernel/',
        guide: 'init',
        layer: layer.key,
        slots: inAct
          .filter((level) => level.region === id)
          .map((level) => ({
            number: String(levels.indexOf(level) + 1),
            title: level.title,
            levelId: level.id,
            optional: false,
          })),
      })),
    }
  })
}

/** Content built from `levels` in that order, with the example skill tree; throws if it doesn't validate. */
export function contentOf(levels: readonly LevelDefinition[], checkers: LevelCheckers = {}): GameContent {
  const content = createGameContent({ acts: exampleOutline(levels), levels, skills: EXAMPLE_SKILLS, checkers })
  if (!content.ok) {
    throw new Error(content.errors.join('\n'))
  }
  return content.value
}

/** The example level with its checker, then the level it unlocks. */
export const exampleContent = (): GameContent =>
  contentOf([EXAMPLE_LEVEL, FOLLOW_UP_LEVEL], { [EXAMPLE_LEVEL.id]: EXAMPLE_CHECKER })

const fromAscii = (bytes: Uint8Array) => String.fromCharCode(...bytes)

/** Checks the example level from the lab's event stream alone. */
export const EXAMPLE_CHECKER: LevelChecker = {
  check({ events }) {
    const output = events.flatMap((event) => (event.type === 'console_write' ? [fromAscii(event.bytes)] : [])).join('')
    const exit = events.find((event) => event.type === 'sched_process_exit')
    const failedWrites = events.filter((event) => event.type === 'sys_exit' && event.name === 'write' && event.ret < 0)
    const objectivesMet = [
      ...(output === 'hello\n' ? ['prints-hello'] : []),
      ...(exit?.code === 0 ? ['exits-cleanly'] : []),
    ]
    const taint: TaintEvent[] =
      exit?.code === 0
        ? failedWrites.map((event) => ({
            ruleId: 'ignored-write-error',
            detail: 'write() returned an error and the program exited with status 0',
            seq: event.seq,
          }))
        : []
    return { objectivesMet, taint }
  },
}

const NR_WRITE = syscallNr('write')
const EBADF = 9
const ascii = (text: string) => Uint8Array.from(text, (c) => c.charCodeAt(0))

/**
 * Events of `./hello` printing hello, from its execve() on; with
 * `failedWriteFirst`, an ignored EBADF write comes first.
 */
export function helloRunEvents(options: { readonly failedWriteFirst?: boolean } = {}): LabEvent[] {
  const pid = 2
  const events: LabEventInit[] = [{ type: 'sched_process_exec', pid, oldPid: pid, filename: './hello' }]
  if (options.failedWriteFirst) {
    events.push(
      { type: 'sys_enter', pid, nr: NR_WRITE, name: 'write', args: [7, 0x1000, 6], data: ascii('hello\n') },
      { type: 'sys_exit', pid, nr: NR_WRITE, name: 'write', ret: -EBADF }
    )
  }
  events.push(
    { type: 'sys_enter', pid, nr: NR_WRITE, name: 'write', args: [1, 0x1000, 6], data: ascii('hello\n') },
    { type: 'console_write', bytes: ascii('hello\n') },
    { type: 'sys_exit', pid, nr: NR_WRITE, name: 'write', ret: 6 },
    { type: 'sched_process_exit', pid, code: 0 }
  )
  return events.map((event, seq): LabEvent => ({ ...event, seq, time: seq * 1000 }))
}
