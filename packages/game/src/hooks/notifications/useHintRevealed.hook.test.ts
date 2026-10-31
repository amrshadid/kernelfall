// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHintRevealed } from '#hooks/notifications/useHintRevealed.hook'
import { EXAMPLE_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'

describe('useHintRevealed', () => {
  afterEach(uninstallTestGame)

  it('hears each hint by tier while mounted, and nothing after unmount', async () => {
    const { clock } = installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    await level.next()
    await level.next()
    const handler = vi.fn()
    const { unmount } = renderHook(() => useHintRevealed(handler))

    await level.revealHint()
    expect(handler).toHaveBeenCalledExactlyOnceWith({ levelId: EXAMPLE_LEVEL.id, tier: 'nudge', at: clock.now() })

    unmount()
    await level.revealHint()
    expect(handler).toHaveBeenCalledOnce()
  })
})
