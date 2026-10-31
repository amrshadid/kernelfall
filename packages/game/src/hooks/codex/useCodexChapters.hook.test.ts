// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useCodexChapters } from '#hooks/codex/useCodexChapters.hook'
import { EXAMPLE_LEVEL, FOLLOW_UP_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'

describe('useCodexChapters', () => {
  afterEach(uninstallTestGame)

  it('follows the player: cards hidden, seen once their level starts, filed once it is passed', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    const { result } = renderHook(() => useCodexChapters())
    const states = () => result.current.flatMap((chapter) => chapter.cards.map((entry) => entry.state))

    expect(result.current.map((chapter) => chapter.region.id)).toEqual([EXAMPLE_LEVEL.region])
    expect(states()).toEqual(['hidden', 'hidden'])

    await act(async () => {
      await level.start(EXAMPLE_LEVEL.id)
    })
    expect(states()).toEqual(['seen', 'hidden'])

    await act(async () => {
      await level.next()
      await level.next()
      await level.useReference()
    })
    expect(states()).toEqual(['filed', 'hidden'])
    expect(result.current[0]?.cards[1]?.levelId).toBe(FOLLOW_UP_LEVEL.id)
  })
})
