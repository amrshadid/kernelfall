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

  it('give every question at least two answers, exactly one of them what happens, outside the scene and debrief', () => {
    const asked = ['see-it', 'build-it', 'watch-it']
    const wrong = content.game.levels.flatMap((level) =>
      [...(content.stories.get(level.id) ?? [])].flatMap(([section, blocks]) =>
        blocks
          .filter((block) => block.kind === 'predict')
          .filter(
            (block) =>
              block.options.length < 2 ||
              block.options.filter((option) => option.right).length !== 1 ||
              !asked.includes(section)
          )
          .map((block) => `${level.id}#${section}: ${block.text}`)
      )
    )
    expect(wrong).toEqual([])
  })

  it('ask a question in every built level', () => {
    const silent = content.game.levels
      .filter(
        (level) =>
          ![...(content.stories.get(level.id)?.values() ?? [])].some((blocks) =>
            blocks.some((block) => block.kind === 'predict')
          )
      )
      .map((level) => level.id)
    expect(silent).toEqual([])
  })
})
