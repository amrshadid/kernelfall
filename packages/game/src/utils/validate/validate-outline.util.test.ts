import type { Validated } from '@kernelfall/core/types'
import { describe, expect, it } from 'vitest'
import { exampleLayer } from '#test/index'
import { validateAct, validateMapLayer, validateRegion, validateSkills } from '#utils/validate/validate-outline.util'

const errorsOf = <T>(result: Validated<T>): readonly string[] => (result.ok ? [] : result.errors)

const USERLAND = exampleLayer('userland')

const REGION_YAML = {
  id: 'process-district',
  name: 'Process District',
  boss: false,
  caption: 'fork, exec and wait',
  source: 'kernel/',
  guide: 'init',
  slots: [
    { number: '1.4', title: 'Run Anything', level: '04-run-anything' },
    { number: '1.5', title: 'Planned', optional: true },
  ],
}

describe('validateMapLayer', () => {
  it('reads a layer with every text field', () => {
    expect(validateMapLayer(USERLAND)).toEqual({ ok: true, value: USERLAND })
  })

  it('reports a key that is not kebab-case, missing text and unknown fields', () => {
    const { note: _note, ...withoutNote } = USERLAND
    expect(errorsOf(validateMapLayer({ ...withoutNote, key: 'User Land', depth: 3 }))).toEqual([
      'depth: unknown field (expected one of: key, name, short, kicker, caption, note, source, guides)',
      'key: expected a kebab-case id like process-district, got "User Land"',
      'note: expected non-empty text, got nothing',
    ])
  })
})

describe('validateAct', () => {
  it("reads an act's id, name and layer", () => {
    expect(validateAct({ id: 'act1', name: 'Act I', layer: USERLAND })).toEqual({
      ok: true,
      value: { id: 'act1', name: 'Act I', layer: USERLAND },
    })
  })

  it("reports an unknown act and the layer's problems with their path", () => {
    expect(errorsOf(validateAct({ id: 'act9', name: 'Act IX', layer: { ...USERLAND, short: '' } }))).toEqual([
      'id: expected one of prologue, act1, act2, act3, got "act9"',
      'layer.short: expected non-empty text, got empty text',
    ])
  })
})

describe('validateRegion', () => {
  it('reads the region and its slots in play order, a planned slot without a level', () => {
    const result = validateRegion(REGION_YAML)
    expect(result.ok && result.value.slots).toEqual([
      { number: '1.4', title: 'Run Anything', level: '04-run-anything', optional: false },
      { number: '1.5', title: 'Planned', optional: true },
    ])
  })

  it('reads a layer of its own, or the key of the layer it is drawn in', () => {
    const own = validateRegion({ ...REGION_YAML, layer: exampleLayer('syscall-gate') })
    expect(own.ok && own.value.layer?.key).toBe('syscall-gate')
    const borrowed = validateRegion({ ...REGION_YAML, inLayer: 'userland' })
    expect(borrowed.ok && borrowed.value.inLayer).toBe('userland')
  })

  it('takes layer or inLayer, not both', () => {
    expect(errorsOf(validateRegion({ ...REGION_YAML, layer: USERLAND, inLayer: 'userland' }))).toEqual([
      'inLayer: a region with a layer of its own is drawn in it: give layer or inLayer, not both',
    ])
  })

  it('reports a slot number YAML read as a number, since 1.10 would become 1.1', () => {
    const result = validateRegion({ ...REGION_YAML, slots: [{ number: 1.1, title: 'The Tenth' }] })
    expect(errorsOf(result)).toEqual(['slots[0].number: expected text in quotes, like "1.10", got the number 1.1'])
  })

  it('needs at least one slot', () => {
    expect(errorsOf(validateRegion({ ...REGION_YAML, slots: [] }))).toEqual(['slots: expected at least one slot'])
  })

  it("reports a level folder that isn't <nn>-<slug>, and a boss flag that isn't true or false", () => {
    const slot = { number: '1.4', title: 'Run Anything', level: 'run-anything' }
    expect(errorsOf(validateRegion({ ...REGION_YAML, boss: 'yes', slots: [slot] }))).toEqual([
      'slots[0].level: expected a level folder like 04-run-anything, got "run-anything"',
      'boss: expected true or false, got text',
    ])
  })

  it('reports unknown fields of the region and of a slot', () => {
    expect(
      errorsOf(validateRegion({ ...REGION_YAML, act: 'act1', slots: [{ number: '1.4', title: 'x', id: 'y' }] }))
    ).toEqual([
      'act: unknown field (expected one of: id, name, boss, caption, source, guide, layer, inLayer, slots)',
      'slots[0].id: unknown field (expected one of: number, title, level, optional, summary, minutes)',
    ])
  })

  it("reads a slot's optional summary and rejects one that isn't text", () => {
    const summary = 'Turn a line of text into words.'
    const result = validateRegion({ ...REGION_YAML, slots: [{ number: '1.1', title: 'Words', summary }] })
    expect(result.ok && result.value.slots).toEqual([{ number: '1.1', title: 'Words', optional: false, summary }])
    expect(
      errorsOf(validateRegion({ ...REGION_YAML, slots: [{ number: '1.1', title: 'Words', summary: 3 }] }))
    ).toEqual(['slots[0].summary: expected non-empty text, got a number'])
  })

  it("reads a slot's optional minutes and rejects a number out of range", () => {
    const result = validateRegion({ ...REGION_YAML, slots: [{ number: '1.1', title: 'Words', minutes: 20 }] })
    expect(result.ok && result.value.slots).toEqual([{ number: '1.1', title: 'Words', optional: false, minutes: 20 }])
    expect(
      errorsOf(validateRegion({ ...REGION_YAML, slots: [{ number: '1.1', title: 'Words', minutes: 500 }] }))
    ).toEqual(['slots[0].minutes: expected a number from 1 to 120, got 500'])
  })
})

describe('validateSkills', () => {
  it('reads a list of skill nodes, prerequisites defaulting to none', () => {
    const skills = [
      { id: 'fork', title: 'Make a child with fork()', region: 'process-district' },
      { id: 'exec', title: 'Run a program with exec()', region: 'process-district', prerequisites: ['fork'] },
    ]
    expect(validateSkills(skills)).toEqual({
      ok: true,
      value: [
        { ...skills[0], prerequisites: [] },
        { ...skills[1], prerequisites: ['fork'] },
      ],
    })
  })

  it('needs a list', () => {
    expect(errorsOf(validateSkills({ fork: {} }))).toEqual(['expected a list of skills, got an object'])
  })

  it('reports each node problem with its index', () => {
    expect(errorsOf(validateSkills([{ id: 'Fork', title: 'x', region: 'process-district', extra: 1 }]))).toEqual([
      '[0].extra: unknown field (expected one of: id, title, region, prerequisites)',
      '[0].id: expected a kebab-case id like process-district, got "Fork"',
    ])
  })
})
