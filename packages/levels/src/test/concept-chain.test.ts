import type { ConceptId, ConceptViolation, ConceptViolationKind } from '@kernelfall/game/types'
import { conceptChain } from '@kernelfall/game/utils'
import { describe, expect, it } from 'vitest'
import { loadedContent } from '#test/index'
import { labelOf } from '#utils/label/level-label.util'

// Today's breaks, each with why; the rewrite empties this list level by level.
const KNOWN_CONCEPT_GAPS: Readonly<Record<ConceptViolationKind, Readonly<Record<ConceptId, string>>>> = {
  'used-before-taught': {
    'device-file': 'P.1 no longer shows /dev; P.7 uses /dev/null and P.9 explains device files without declaring it',
    hex: "P.4's e820 addresses come before P.5 explains hex",
    'library-function':
      "1.4 calls execvp() and strerror(); library functions are taught in Act I's 1.0, which isn't built",
    pipe: "P.4's `dmesg | grep`, P.7's `top | head` and S.4's aside come before S.5 teaches `|`",
    interrupt: "P.4 and P.7 name interrupts; P.6 leaves them to a Codex card, and Act II's 2.10b teaches them",
    scheduler: 'P.4 names the scheduler; P.7 explains it',
    module: "P.4's initcall lines show modules; P.5 explains them",
    page: 'P.5 says "the kernel\'s pages stay in place"; P.8 explains pages',
    'command-substitution': "P.5's `ls /lib/modules/$(uname -r)` is never explained",
    redirection: "P.7's `yes > /dev/null` comes before S.4 teaches `>`",
    'background-job': "P.7's `&` and `%1`, and 1.4's real-world card, are never explained in the game",
  },
  'taught-twice': {
    builtin: 'S.1 explains the builtin again after P.3',
    'user-space': 'P.4 means the programs outside the kernel; P.5 means the low 3 GiB of addresses',
    'proc-fs': 'P.9 and S.1 explain /proc again after P.7',
    mount: 'P.9 defines mounts again after P.4',
    signal: 'S.3 defines signals in the same words as P.5',
    'virtual-memory': '1.4 introduces the virtual address space as new after P.8',
  },
  'never-used-again': {
    'man-page': 'no later level asks for a man page',
    uefi: 'P.4 explains UEFI on a Machine that has none',
    monolithic: "P.5's monolithic kernel never returns",
    'device-tree': "P.6's device tree returns only in Act III's 3.14",
    'page-cache': "P.8's page cache never returns",
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
