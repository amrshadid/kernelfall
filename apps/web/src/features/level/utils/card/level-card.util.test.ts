import type { LevelRunState } from '@kernelfall/game/types'
import { createLevelRun } from '@kernelfall/game/utils'
import type { LoadedContent } from '@kernelfall/levels/types'
import { appContent, labelOf } from '@kernelfall/levels/utils'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_HEADLINE } from './level-card.constants'
import { type CardInput, levelCardOf } from './level-card.util'

const FIRST_WORDS = 'prologue-boot-path-02-first-words'
const SPEAK_TO_SHELL = 'prologue-boot-path-03-speak-to-shell'
const RUN_ANYTHING = 'act1-process-district-04-run-anything'

function loaded(): LoadedContent {
  const content = appContent()
  if (!content.ok) {
    throw new Error(content.errors.join('\n'))
  }
  return content.value
}

function cardInput(levelId: string, fields: Partial<CardInput> = {}): CardInput {
  const content = loaded()
  const level = content.game.level(levelId)
  const label = labelOf(content, levelId)
  if (!level || !label) {
    throw new Error(`no ${levelId}`)
  }
  const run: LevelRunState = { ...createLevelRun(levelId), phase: 'card' }
  return {
    level,
    label,
    run,
    passing: level.objectives.length,
    taint: 0,
    story: content.stories.get(levelId),
    content,
    next: vi.fn(async () => ({ success: true }) as const),
    navigate: vi.fn(),
    replay: vi.fn(),
    ...fields,
  } as CardInput
}

describe('levelCardOf', () => {
  it("files the level's cards and says how it went", () => {
    const input = cardInput(FIRST_WORDS, { taint: 2 })
    const card = levelCardOf(input)
    expect(card.cards).toBe(input.level.codex)
    expect(card.result).toBe(`Level complete · ${input.passing} of ${input.level.objectives.length} · Taint 2`)
    expect(card.headline).not.toBe(DEFAULT_HEADLINE)
  })

  it("says when init's version finished the level", () => {
    const run: LevelRunState = {
      ...createLevelRun(FIRST_WORDS),
      phase: 'complete',
      outcome: { via: 'reference', taint: [], hintsRevealed: 3, score: 0 },
    }
    expect(levelCardOf(cardInput(FIRST_WORDS, { run })).result).toMatch(
      /^Completed with init's version · .* · Taint 0, clean$/
    )
  })

  it('files the card before going on to the next level', async () => {
    const input = cardInput(FIRST_WORDS)
    const card = levelCardOf(input)
    expect(card.next?.label).toBe('Next level: Speak to the Shell')

    card.next?.onSelect()
    await vi.waitFor(() => expect(input.navigate).toHaveBeenCalledWith({ name: 'play', levelId: SPEAK_TO_SHELL }))
    expect(input.next).toHaveBeenCalledOnce()
  })

  it('offers only the map after the last level, without filing a card twice', async () => {
    const run: LevelRunState = { ...createLevelRun(RUN_ANYTHING), phase: 'complete' }
    const input = cardInput(RUN_ANYTHING, { run })
    const card = levelCardOf(input)
    expect(card.next).toBeNull()

    card.onMap()
    await vi.waitFor(() => expect(input.navigate).toHaveBeenCalledWith({ name: 'map' }))
    expect(input.next).not.toHaveBeenCalled()
  })

  it('files the card, then replays the level', async () => {
    const input = cardInput(FIRST_WORDS)
    levelCardOf(input).onReplay()
    await vi.waitFor(() => expect(input.replay).toHaveBeenCalledOnce())
    expect(input.next).toHaveBeenCalledOnce()
  })
})
