import { describe, expect, it } from 'vitest'
import { exampleLevel } from '#test/index'
import type { LevelDefinition } from '#types/definitions/level'
import { conceptChain } from '#utils/concepts/concept-chain.util'

const PROLOGUE = { act: 'prologue', region: 'boot-path' } as const

function prologueLevel(n: number, teaches: string[], uses: string[] = []): LevelDefinition {
  return exampleLevel({ id: `prologue-boot-path-0${n}-level`, teaches, uses }, PROLOGUE)
}

describe('conceptChain', () => {
  it('accepts a chain where every concept is taught once, before it is used, and returns later', () => {
    const levels = [
      prologueLevel(1, ['process']),
      prologueLevel(2, ['syscall'], ['process']),
      prologueLevel(3, ['fd'], ['syscall']),
      exampleLevel({ teaches: ['fork'], uses: ['fd', 'process'] }),
    ]

    expect(conceptChain(levels)).toEqual([])
  })

  it('reports a use before the level that teaches it, and a use no level ever teaches', () => {
    const levels = [
      prologueLevel(1, [], ['pipe', 'hex']),
      prologueLevel(2, ['pipe'], []),
      exampleLevel({ uses: ['pipe'] }),
    ]

    expect(conceptChain(levels)).toEqual([
      { kind: 'used-before-taught', concept: 'pipe', levelId: levels[0]?.id, other: levels[1]?.id },
      { kind: 'used-before-taught', concept: 'hex', levelId: levels[0]?.id, other: null },
    ])
  })

  it('reports a second teaching, and a Prologue concept nothing later uses or teaches again', () => {
    const levels = [
      prologueLevel(1, ['signal', 'encoding']),
      prologueLevel(2, ['signal']),
      exampleLevel({ teaches: ['wait'] }),
    ]

    expect(conceptChain(levels)).toEqual([
      { kind: 'never-used-again', concept: 'encoding', levelId: levels[0]?.id, other: null },
      { kind: 'taught-twice', concept: 'signal', levelId: levels[1]?.id, other: levels[0]?.id },
    ])
  })
})
