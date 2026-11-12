import type { ConceptId, ConceptViolation, ConceptViolationKind } from '@kernelfall/game/types'
import { conceptChain } from '@kernelfall/game/utils'
import { describe, expect, it } from 'vitest'
import { loadedContent } from '#test/index'
import { labelOf } from '#utils/label/level-label.util'

// Today's breaks, each with why; the rewrite empties this list level by level.
const KNOWN_CONCEPT_GAPS: Readonly<Record<ConceptViolationKind, Readonly<Record<ConceptId, string>>>> = {
  'used-before-taught': {
    'library-function':
      "1.4 calls execvp() and strerror(); library functions are taught in Act I's 1.0, which isn't built",
  },
  'taught-twice': {
    signal: 'S.3 defines signals in the same words as P.5',
    'virtual-memory': '1.4 introduces the virtual address space as new after P.8',
  },
  'never-used-again': {
    'man-page': 'no later level asks for a man page',
    uefi: 'P.4 names UEFI to say the Machine has a BIOS; nothing later needs it',
    'device-tree': "P.6's device tree returns only in Act III's 3.14",
    'pending-signal': "S.3's ShdPnd is never read again",
    stderr: "S.4's standard error is not used by S.5 or 1.4",
    'text-line': "S.5's lines return only with Act I's 1.0, which isn't built",
  },
}

const content = loadedContent()
const violations = conceptChain(content.game.levels)
const numberOf = (levelId: string) => labelOf(content, levelId)?.number ?? levelId
const describeViolation = (violation: ConceptViolation) =>
  `${violation.kind}: ${violation.concept} in ${numberOf(violation.levelId)}${violation.other ? ` (${numberOf(violation.other)})` : ''}`

describe('the chain of concepts', () => {
  it('has no break but the known ones', () => {
    const unknown = violations.filter(
      (violation) => KNOWN_CONCEPT_GAPS[violation.kind][violation.concept] === undefined
    )
    expect(unknown.map(describeViolation)).toEqual([])
  })

  it('lists only known gaps that are still there', () => {
    const stale = Object.entries(KNOWN_CONCEPT_GAPS).flatMap(([kind, gaps]) =>
      Object.keys(gaps)
        .filter((concept) => !violations.some((violation) => violation.kind === kind && violation.concept === concept))
        .map((concept) => `${kind}: ${concept}`)
    )
    expect(stale).toEqual([])
  })
})
