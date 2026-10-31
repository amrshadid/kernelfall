// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAchievementUnlocked } from '#hooks/notifications/useAchievementUnlocked.hook'
import { EXAMPLE_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'

describe('useAchievementUnlocked', () => {
  afterEach(uninstallTestGame)

  it('hears each achievement once, as it is earned', async () => {
    const { clock } = installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    await level.next()
    await level.next()
    const handler = vi.fn()
    renderHook(() => useAchievementUnlocked(handler))

    await level.oops({ text: 'BUG: unable to handle page fault' })
    await level.respawn()
    await level.oops({ text: 'BUG: unable to handle page fault' })

    expect(handler).toHaveBeenCalledExactlyOnceWith({
      achievementId: 'first-oops',
      title: 'First Oops',
      at: clock.now(),
    })
  })
})
