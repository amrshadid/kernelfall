import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL, EXAMPLE_SKILLS, exampleOutline, FOLLOW_UP_LEVEL } from '#test/index'
import type { GameContent } from '#types/definitions/content'
import type { FieldGuide, FieldGuideEntry } from '#types/definitions/field-guide'
import { createGameContent } from '#utils/content/index'
import { fieldGuideView } from '#utils/field-guide/field-guide.util'
import { emptyProgress, placeLevels, startLevel } from '#utils/progress/index'

// exampleOutline() numbers its slots "1" and "2": the example level and its follow-up.
const entry = (name: string, firstMet: string): FieldGuideEntry => ({
  name,
  kind: 'command',
  what: `${name} does things`,
  syscalls: ['write'],
  firstMet,
  deepenedIn: [],
})
const GUIDE: FieldGuide = { opensAt: '2', entries: [entry('echo', '1'), entry('ls', '2')] }

function contentWith(fieldGuide?: FieldGuide): GameContent {
  const levels = [EXAMPLE_LEVEL, FOLLOW_UP_LEVEL]
  const content = createGameContent({
    acts: exampleOutline(levels),
    levels,
    skills: EXAMPLE_SKILLS,
    ...(fieldGuide ? { fieldGuide } : {}),
  })
  if (!content.ok) {
    throw new Error(content.errors.join('\n'))
  }
  return content.value
}

describe('fieldGuideView', () => {
  const content = contentWith(GUIDE)

  it('stays closed until the level that opens it starts', () => {
    const firstStarted = startLevel(emptyProgress(), EXAMPLE_LEVEL, 1).progress

    expect(fieldGuideView(content, firstStarted)).toEqual({ open: false, entries: [] })
  })

  it("lists the entries of every level started so far, in the guide's order", () => {
    const secondOnly = startLevel(emptyProgress(), FOLLOW_UP_LEVEL, 1).progress
    const both = startLevel(secondOnly, EXAMPLE_LEVEL, 2).progress

    expect(fieldGuideView(content, secondOnly).entries.map((shown) => shown.name)).toEqual(['ls'])
    expect(fieldGuideView(content, both).entries.map((shown) => shown.name)).toEqual(['echo', 'ls'])
  })

  it('counts a level placed by a placement check as reached', () => {
    const placed = placeLevels(emptyProgress(), [EXAMPLE_LEVEL.id, FOLLOW_UP_LEVEL.id], 1)

    expect(fieldGuideView(content, placed)).toEqual({ open: true, entries: GUIDE.entries })
  })

  it('is closed for content without a guide', () => {
    expect(fieldGuideView(contentWith(), placeLevels(emptyProgress(), [FOLLOW_UP_LEVEL.id], 1)).open).toBe(false)
  })
})

describe('createGameContent: the field guide', () => {
  it('reports a slot the outline does not have', () => {
    const levels = [EXAMPLE_LEVEL, FOLLOW_UP_LEVEL]
    const result = createGameContent({
      acts: exampleOutline(levels),
      levels,
      skills: EXAMPLE_SKILLS,
      fieldGuide: { opensAt: 'P.3', entries: [{ ...entry('cd', '9'), deepenedIn: ['1.5'] }] },
    })

    expect(result.ok ? [] : result.errors).toEqual([
      'field guide: opens at "P.3", which is no slot of the outline',
      'field guide: cd names "9", which is no slot of the outline',
      'field guide: cd names "1.5", which is no slot of the outline',
    ])
  })
})
