import type { LevelDefinition } from '@kernelfall/game/types'
import { describe, expect, it } from 'vitest'
import { countAsides, countWords, lintLevel, strayWords } from '#utils/lint/content-lint.util'
import { parseStory } from '#utils/story/story.util'

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ')

const CARD = { id: 'syscall', term: 'syscall', summary: 's', sources: [], docs: 'https://x', tryIt: 'x' }

function levelWith(fields: Partial<LevelDefinition>): LevelDefinition {
  return { id: 'prologue-boot-path-02-first-words', codex: [CARD], ...fields } as LevelDefinition
}

function storyWith(sections: Readonly<Record<string, string>>) {
  return parseStory(
    Object.entries(sections)
      .map(([heading, body]) => `## ${heading}\n\n${body}\n`)
      .join('\n')
  )
}

const KEEPS_BUDGETS = storyWith({
  Scene: `> **init:** ${words(70)}`,
  'See it': `> **init:** ${words(190)}\n\n\`\`\`\n${words(500)}\n\`\`\``,
  'Build it': words(140),
  'Watch it': words(100),
  Debrief: words(40),
  'Real world': words(300),
})

describe('countWords', () => {
  it('counts tokens with a letter or digit, inline code included, and skips dashes', () => {
    expect(countWords('Run `ls /` now — 3 times.')).toBe(5)
  })
})

describe('countAsides', () => {
  it('counts parentheses in prose, not in inline code', () => {
    expect(countAsides('Call `write()` (the syscall), then (again) `exit(0)`.')).toBe(2)
  })
})

describe('lintLevel', () => {
  it('measures each step without its code and finds nothing in a level that keeps every budget', () => {
    const lint = lintLevel(levelWith({ teaches: ['syscall', 'fd'] }), KEEPS_BUDGETS)

    expect(lint.steps.map((step) => [step.section, step.words])).toEqual([
      ['scene', 70],
      ['see-it', 190],
      ['build-it', 140],
      ['watch-it', 100],
      ['debrief', 40],
    ])
    expect(lint.storyWords).toBe(540)
    expect(lint.problems).toEqual([])
  })

  it('names every budget a level breaks', () => {
    const story = storyWith({
      Scene: `> **init:** ${words(90)} (an aside)`,
      'See it': 'The game restarts. Your numbers will differ.',
      Debrief: words(10),
      'Real world': 'The emulator is v86.',
    })
    const level = levelWith({
      teaches: ['a', 'b', 'c', 'd'],
      codex: [{ ...CARD, simple: words(30), deep: words(81) }],
    })

    expect(lintLevel(level, story).problems).toEqual([
      'teaches 4 concepts (budget 3)',
      'story: 109 words (budget 500–650)',
      'scene: 92 words (budget 80)',
      '1 parenthetical asides (budget 0)',
      'see-it: "the game"',
      'see-it: "your numbers will differ"',
      'real-world: "emulator"',
      'codex syscall: simple 30 words (budget 25)',
      'codex syscall: deep 81 words (budget 80)',
    ])
  })
})

describe('strayWords', () => {
  const P2 = 'prologue-boot-path-02-first-words'
  const P9 = 'prologue-machine-in-section-09-files-doors-wires'
  const S2 = 'prologue-surface-survey-02-who-may-enter'

  it("keeps a floor to the drawing's three", () => {
    expect(strayWords(P2, 'Three floors, most of them dark. The hardware floor fills in.')).toEqual([])
    expect(strayWords(P2, 'One floor up, the scheduler decides.')).toEqual([expect.stringContaining('floor')])
  })

  it('keeps a door to device files: P.9, and its title anywhere', () => {
    expect(strayWords(P9, 'A door to a driver.')).toEqual([])
    expect(strayWords(P2, 'In Files, Doors and Wires you saw it.')).toEqual([])
    expect(strayWords(P2, 'There is no other door.')).toEqual([expect.stringContaining('door')])
  })

  it('wants the Gate by its name, and leaves inline code alone', () => {
    expect(strayWords(P2, 'Every request crosses the Gate. See `syscall-gate dark`.')).toEqual([])
    expect(strayWords(P2, 'It goes through the gate.')).toEqual([expect.stringContaining('gate')])
  })

  it('keeps a lock to the Survey', () => {
    expect(strayWords(S2, "That is a file's lock. Padlocks on every file.")).toEqual([])
    expect(strayWords(P2, "User mode's locks keep it out.")).toEqual([expect.stringContaining('lock')])
    expect(strayWords(P2, 'The kernel takes a block of memory.')).toEqual([])
  })
})
