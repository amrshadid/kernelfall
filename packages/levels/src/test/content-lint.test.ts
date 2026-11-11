import { describe, expect, it } from 'vitest'
import { loadedContent } from '#test/index'
import { ENFORCED_LEVELS, lintLevel } from '#utils/lint/index'

const content = loadedContent()

describe('the content budgets', () => {
  it('enforce only levels that exist', () => {
    expect(ENFORCED_LEVELS.filter((id) => !content.game.level(id))).toEqual([])
  })

  it.each(ENFORCED_LEVELS.map((id) => [id]))('%s keeps every budget', (levelId) => {
    const level = content.game.level(levelId)
    const story = content.stories.get(levelId)
    expect(level && story && lintLevel(level, story).problems).toEqual([])
  })

  it('find all five steps in every built story; the levels not enforced only warn, in pnpm content:report', () => {
    const missing = content.game.levels.flatMap((level) => {
      const story = content.stories.get(level.id)
      const steps = story ? lintLevel(level, story).steps : []
      return steps.filter((step) => step.words === 0).map((step) => `${level.id}#${step.section}`)
    })
    expect(missing).toEqual([])
  })
})
