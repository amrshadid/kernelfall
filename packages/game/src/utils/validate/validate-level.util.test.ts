import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL_YAML, EXAMPLE_LOCATION, exampleLevel } from '#test/index'
import type { LevelLocation } from '#types/definitions/level'
import { validateLevel } from '#utils/validate/validate-level.util'

const LEVEL_FIELDS =
  'id, title, summary, minutes, tracks, skills, prerequisites, objectives, hints, chips, xray, xrayFocus, codex, taint, fidelity, story, lab, runAs'

function errorsFor(input: unknown, location: LevelLocation = EXAMPLE_LOCATION): readonly string[] {
  const result = validateLevel(input, location)
  return result.ok ? [] : result.errors
}

describe('validateLevel', () => {
  it('accepts the example level and returns it typed, in the act and region of its folders', () => {
    const result = validateLevel(EXAMPLE_LEVEL_YAML, EXAMPLE_LOCATION)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value.hints[2]).toBe(EXAMPLE_LEVEL_YAML.hints[2])
    expect(result.ok && [result.value.act, result.value.region]).toEqual(['act1', 'compilers-quarter'])
  })

  it('leaves the act and region to the folders: level.yaml may not name them', () => {
    expect(errorsFor({ ...EXAMPLE_LEVEL_YAML, act: 'act1', region: 'compilers-quarter' })).toEqual([
      `act: unknown field (expected one of: ${LEVEL_FIELDS})`,
      `region: unknown field (expected one of: ${LEVEL_FIELDS})`,
    ])
  })

  it('reads the optional map summary and rejects an empty one', () => {
    const summary = 'Write your first program and watch it ask the kernel for help.'
    const result = validateLevel({ ...EXAMPLE_LEVEL_YAML, summary }, EXAMPLE_LOCATION)
    expect(result.ok && result.value.summary).toBe(summary)
    const without = validateLevel(EXAMPLE_LEVEL_YAML, EXAMPLE_LOCATION)
    expect(without.ok && 'summary' in without.value).toBe(false)
    expect(errorsFor({ ...EXAMPLE_LEVEL_YAML, summary: '' })).toEqual([
      'summary: expected non-empty text, got empty text',
    ])
  })

  it('reads the optional minutes, a whole number from 1 to 120', () => {
    const result = validateLevel({ ...EXAMPLE_LEVEL_YAML, minutes: 15 }, EXAMPLE_LOCATION)
    expect(result.ok && result.value.minutes).toBe(15)
    const without = validateLevel(EXAMPLE_LEVEL_YAML, EXAMPLE_LOCATION)
    expect(without.ok && 'minutes' in without.value).toBe(false)
    expect(errorsFor({ ...EXAMPLE_LEVEL_YAML, minutes: 0 })).toEqual([
      'minutes: expected a number from 1 to 120, got 0',
    ])
    expect(errorsFor({ ...EXAMPLE_LEVEL_YAML, minutes: '15' })).toEqual(['minutes: expected a whole number, got text'])
  })

  it('requires exactly three hints', () => {
    expect(errorsFor({ ...EXAMPLE_LEVEL_YAML, hints: ['one', 'two'] })).toEqual([
      'hints: expected exactly 3 hints (nudge, concept, spot), got 2',
    ])
  })

  it('reports every problem with the path to the field', () => {
    const errors = errorsFor(
      {
        ...EXAMPLE_LEVEL_YAML,
        tracks: ['c', 'rust'],
        taint: [{ id: 'leak', kind: 'memory_leak', points: 0, description: 'x' }],
        codex: [{ ...EXAMPLE_LEVEL_YAML.codex[0], docs: 'http://insecure.example' }],
        story: { scene: 'story.md#scene', debrief: 'debrief', realWorld: 'story.md#real-world' },
        hint: 'typo',
      },
      { ...EXAMPLE_LOCATION, act: 'prologue' }
    )
    expect(errors).toEqual([
      `hint: unknown field (expected one of: ${LEVEL_FIELDS})`,
      'tracks[1]: expected one of c, userland, kernel, net, debug, got "rust"',
      'codex[0].docs: expected an https:// link, got "http://insecure.example"',
      'taint[0].points: expected a number from 1 to 9007199254740991, got 0',
      'story.debrief: expected a story section like story.md#scene, got "debrief"',
      'id: expected "prologue-compilers-quarter-<nn>-<slug>" (from its act and region), got "act1-compilers-quarter-01-hello-write"',
    ])
  })

  it('reads a card with simple and deep text, which may leave the summary out', () => {
    const { summary: _summary, ...card } = EXAMPLE_LEVEL_YAML.codex[0]
    const level = exampleLevel({
      codex: [
        { ...card, simple: 'Hands bytes to the kernel.', deep: 'ksys_write() calls vfs_write().', deepens: 'syscall' },
      ],
    })

    expect(level.codex[0]).toMatchObject({
      summary: 'Hands bytes to the kernel.',
      simple: 'Hands bytes to the kernel.',
      deep: 'ksys_write() calls vfs_write().',
      deepens: 'syscall',
    })
  })

  it('checks the simple and deep text of a card', () => {
    const { summary: _summary, ...card } = EXAMPLE_LEVEL_YAML.codex[0]
    expect(errorsFor({ ...EXAMPLE_LEVEL_YAML, codex: [{ ...card, deep: 'text', deepens: 'write-syscall' }] })).toEqual([
      'codex[0].deep: a card with a deep text also needs its simple line',
      'codex[0].deepens: a card cannot deepen itself',
      'codex[0].summary: expected non-empty text, got nothing',
    ])
  })

  it('checks that the id matches the act and region', () => {
    expect(errorsFor({ ...EXAMPLE_LEVEL_YAML, id: 'act1-process-district-01-hello' })).toEqual([
      'id: expected "act1-compilers-quarter-<nn>-<slug>" (from its act and region), got "act1-process-district-01-hello"',
    ])
  })

  it('rejects duplicate ids, empty required lists and self-prerequisites', () => {
    const objective = EXAMPLE_LEVEL_YAML.objectives[0]
    expect(
      errorsFor({
        ...EXAMPLE_LEVEL_YAML,
        objectives: [objective, objective],
        codex: [],
        prerequisites: ['write-to-stdout'],
      })
    ).toEqual([
      'codex: expected at least one entry',
      'objectives: "prints-hello" appears more than once',
      'prerequisites: "write-to-stdout" is also a skill this level unlocks',
    ])
  })

  it('takes no X-ray view for a level played before X-ray is unlocked, and the boot view for the boot', () => {
    expect(exampleLevel({ xray: [] }).xray).toEqual([])
    expect(exampleLevel({ xray: ['boot'] }).xray).toEqual(['boot'])
  })

  it('reads command chips, each a command and its one-line explanation', () => {
    const chips = [{ command: 'ls /bin', explain: 'list the folder /bin' }]

    expect(exampleLevel({ chips }).chips).toEqual(chips)
    expect(exampleLevel()).not.toHaveProperty('chips')
    expect(
      errorsFor({ ...EXAMPLE_LEVEL_YAML, chips: [{ command: 'ls' }, { command: 'ls', explain: 'list' }] })
    ).toEqual(['chips[0].explain: expected non-empty text, got nothing', 'chips: "ls" appears more than once'])
  })

  it('explains a missing or wrongly typed document', () => {
    expect(errorsFor(null)[0]).toBe('expected an object, got null')
    expect(errorsFor({ ...EXAMPLE_LEVEL_YAML, title: 7 })).toEqual(['title: expected non-empty text, got a number'])
  })
})

describe('validateLevel: the lab block', () => {
  it('leaves lab out when the level starts on the shared Machine', () => {
    const result = validateLevel(EXAMPLE_LEVEL_YAML, EXAMPLE_LOCATION)
    expect(result.ok && result.value).not.toHaveProperty('lab')
  })

  it("keeps a valid lab block, read by the Machine's own schema", () => {
    const result = validateLevel({ ...EXAMPLE_LEVEL_YAML, lab: { cwd: '/tmp' } }, EXAMPLE_LOCATION)
    expect(result.ok && result.value.lab).toEqual({ cwd: '/tmp' })
  })

  it("reports the Machine's errors with their lab. path", () => {
    const errors = errorsFor({ ...EXAMPLE_LEVEL_YAML, lab: { bin: 'ls' } })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.every((error) => error.startsWith('lab.'))).toBe(true)
  })
})

describe('validateLevel: xrayFocus', () => {
  it('reads syscall names X-ray keeps open, and refuses anything else', () => {
    const result = validateLevel({ ...EXAMPLE_LEVEL_YAML, xrayFocus: ['fork', 'pipe'] }, EXAMPLE_LOCATION)
    expect(result.ok && result.value.xrayFocus).toEqual(['fork', 'pipe'])
    expect(errorsFor({ ...EXAMPLE_LEVEL_YAML, xrayFocus: ['Fork()'] })).toHaveLength(1)
  })
})

describe('validateLevel: runAs cues', () => {
  it("keeps a cue naming one of the level's objectives and an account on its Machine", () => {
    const runAs = [{ after: 'prints-hello', user: 'guest', command: 'cat /home/you/notes.txt' }]
    const lab = { users: [{ name: 'guest', uid: 1001 }] }
    const result = validateLevel({ ...EXAMPLE_LEVEL_YAML, lab, runAs }, EXAMPLE_LOCATION)
    expect(result.ok && result.value.runAs).toEqual(runAs)
  })

  it('refuses an unknown objective or user, and a command of more than one line', () => {
    const runAs = [{ after: 'knocked', user: 'guest', command: 'cat a\ncat b' }]
    expect(errorsFor({ ...EXAMPLE_LEVEL_YAML, runAs })).toEqual([
      'runAs[0].command: expected one command line, got "cat a\ncat b"',
      'runAs[0].after: no objective "knocked"',
      `runAs[0].user: no user named "guest" on the level's Machine`,
    ])
  })
})
