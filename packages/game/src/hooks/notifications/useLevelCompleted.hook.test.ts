// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useLevelCompleted } from '#hooks/notifications/useLevelCompleted.hook'
import { EXAMPLE_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'

describe('useLevelCompleted', () => {
  afterEach(uninstallTestGame)

  it("hears a level passed with init's version: no score and no Taint", async () => {
    const { clock } = installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    await level.next()
    await level.next()
    const handler = vi.fn()
    renderHook(() => useLevelCompleted(handler))

    await level.useReference()
    // The rest of the loop (watch it, the card) completes nothing new.
    await level.next()
    await level.next()

    expect(handler).toHaveBeenCalledExactlyOnceWith({
      levelId: EXAMPLE_LEVEL.id,
      via: 'reference',
      score: 0,
      taint: 0,
      at: clock.now(),
    })
  })
})
