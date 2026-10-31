import type { Validated } from '@kernelfall/game/types'
import { describe, expect, it } from 'vitest'
import { readYaml } from '#utils/loader/read-yaml.util'

const PATH = 'a/act.yaml'

const named = (input: unknown): Validated<string> =>
  typeof input === 'object' && input !== null && 'name' in input && typeof input.name === 'string'
    ? { ok: true, value: input.name }
    : { ok: false, errors: ['name: expected a string'] }

describe('readYaml', () => {
  it('parses and validates the file', () => {
    const errors: string[] = []
    expect(readYaml('name: init', PATH, named, errors)).toBe('init')
    expect(errors).toEqual([])
  })

  it('reports YAML that does not parse, with its path', () => {
    const errors: string[] = []
    expect(readYaml('name: [', PATH, named, errors)).toBeNull()
    expect(errors[0]).toMatch(/^a\/act\.yaml: not valid YAML/)
  })

  it("reports each validation problem with the file's path", () => {
    const errors: string[] = []
    expect(readYaml('name: 1', PATH, named, errors)).toBeNull()
    expect(errors).toEqual(['a/act.yaml: name: expected a string'])
  })
})
