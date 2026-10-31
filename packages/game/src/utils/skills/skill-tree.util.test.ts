import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL, EXAMPLE_SKILLS, FOLLOW_UP_LEVEL } from '#test/index'
import type { SkillNode } from '#types/definitions/skills'
import { isLevelPlayable, skillStatuses, unlockedSkills, validateSkillTree } from '#utils/skills/skill-tree.util'

const node = (id: string, ...prerequisites: string[]): SkillNode => ({
  id,
  title: id,
  region: 'r',
  prerequisites,
})

describe('skill tree', () => {
  it('accepts the example tree and levels', () => {
    expect(validateSkillTree(EXAMPLE_SKILLS, [EXAMPLE_LEVEL, FOLLOW_UP_LEVEL])).toEqual([])
  })

  it('reports duplicates, unknown references and cycles', () => {
    const nodes = [node('a', 'c'), node('b', 'a'), node('c', 'b'), node('d', 'ghost'), node('d')]
    expect(validateSkillTree(nodes, [EXAMPLE_LEVEL])).toEqual([
      'skill "d" is defined more than once',
      'skill "d" requires unknown skill "ghost"',
      `level "${EXAMPLE_LEVEL.id}" refers to unknown skill "write-to-stdout"`,
      'prerequisite cycle: a → c → b → a',
    ])
  })

  it('finds a skill that requires itself', () => {
    expect(validateSkillTree([node('a', 'a')])).toEqual(['prerequisite cycle: a → a'])
  })

  it('computes unlocked, available and locked from completed levels', () => {
    const levels = [EXAMPLE_LEVEL, FOLLOW_UP_LEVEL]
    const none = unlockedSkills(levels, new Set())
    expect([...skillStatuses(EXAMPLE_SKILLS, none)]).toEqual([
      ['write-to-stdout', 'available'],
      ['exit-status', 'locked'],
    ])
    expect(isLevelPlayable(FOLLOW_UP_LEVEL, none)).toBe(false)

    const some = unlockedSkills(levels, new Set([EXAMPLE_LEVEL.id]))
    expect([...skillStatuses(EXAMPLE_SKILLS, some)]).toEqual([
      ['write-to-stdout', 'unlocked'],
      ['exit-status', 'available'],
    ])
    expect(isLevelPlayable(FOLLOW_UP_LEVEL, some)).toBe(true)
  })
})
