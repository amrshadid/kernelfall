// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useRecall } from '#hooks/codex/useRecall.hook'
import { useProgressStore } from '#store/progress.store'
import { EXAMPLE_LEVEL, FOLLOW_UP_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'

describe('useRecall', () => {
  afterEach(uninstallTestGame)

  it("keeps the player's call on a card, without dealing the deck again", async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    await act(async () => {
      await level.start(EXAMPLE_LEVEL.id)
      await level.next()
      await level.next()
      await level.useReference()
    })
    const { result } = renderHook(() => useRecall(FOLLOW_UP_LEVEL.id))
    const dealt = result.current.deck
    // The follow-up level closes the example region, so its own card is asked too.
    expect(dealt.cards.map((entry) => entry.card.id)).toEqual(['write-syscall', 'exit-status'])

    await act(async () => {
      await result.current.mark('write-syscall', false)
    })
    expect(useProgressStore.getState().progress.recall).toMatchObject([{ cardId: 'write-syscall', knew: false }])
    expect(result.current.deck).toBe(dealt)
  })
})
