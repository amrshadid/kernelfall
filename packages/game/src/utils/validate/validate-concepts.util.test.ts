import { describe, expect, it } from 'vitest'
import { validateConcepts } from '#utils/validate/validate-concepts.util'

const FD = { id: 'fd', term: 'file descriptor', part: 'gate', codex: 'file-descriptors' }

describe('validateConcepts', () => {
  it('reads the catalogue, a concept without a card', () => {
    const hex = { id: 'hex', term: 'hexadecimal', part: 'foundations' }

    expect(validateConcepts({ concepts: [FD, hex] })).toEqual({ ok: true, value: { concepts: [FD, hex] } })
  })

  it('reports a bad id, an unknown part, a repeated concept and unknown fields', () => {
    const result = validateConcepts({
      concepts: [
        { ...FD, id: 'File_Descriptor' },
        { ...FD, part: 'attic' },
        { ...FD, level: 'P.2' },
      ],
    })

    expect(result.ok ? [] : result.errors).toEqual([
      'concepts[0].id: expected a kebab-case id like file-descriptor, got "File_Descriptor"',
      expect.stringMatching(/^concepts\[1\]\.part: expected one of foundations, userland, .*, got "attic"$/),
      'concepts[2].level: unknown field (expected one of: id, term, part, codex)',
      'concepts: "fd" appears more than once',
    ])
  })
})
