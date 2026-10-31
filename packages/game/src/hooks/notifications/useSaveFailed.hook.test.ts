// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSaveFailed } from '#hooks/notifications/useSaveFailed.hook'
import { createFailingStorage, EXAMPLE_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'
import { SAVE_ISSUES } from '#types/definitions/saves'

describe('useSaveFailed', () => {
  afterEach(uninstallTestGame)

  it('hears each save that storage refused', async () => {
    const { clock } = installTestGame({ storage: createFailingStorage() })
    const { level, saves } = renderGameActions()
    await saves.open()
    const handler = vi.fn()
    renderHook(() => useSaveFailed(handler))

    await level.start(EXAMPLE_LEVEL.id)

    expect(handler).toHaveBeenCalledExactlyOnceWith({ issue: SAVE_ISSUES.writeFailed, at: clock.now() })
  })

  it('hears nothing while saves land', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    const handler = vi.fn()
    renderHook(() => useSaveFailed(handler))

    await level.start(EXAMPLE_LEVEL.id)

    expect(handler).not.toHaveBeenCalled()
  })
})
