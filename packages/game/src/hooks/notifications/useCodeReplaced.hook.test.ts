// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCodeReplaced } from '#hooks/notifications/useCodeReplaced.hook'
import { EXAMPLE_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'

const PLAYER_CODE = { 'hello.c': 'int main(void) { return 1; }' }
const REFERENCE_CODE = { 'hello.c': 'int main(void) { return 0; }' }

describe('useCodeReplaced', () => {
  afterEach(uninstallTestGame)

  it("hears init's version loaded, then the player's own code restored", async () => {
    const { clock } = installTestGame()
    const { level, code, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    await level.next()
    await level.next()
    code.setCode(PLAYER_CODE)
    const handler = vi.fn()
    renderHook(() => useCodeReplaced(handler))

    await level.useReference(REFERENCE_CODE)
    await code.restorePlayerCode()

    expect(handler.mock.calls).toEqual([
      [{ levelId: EXAMPLE_LEVEL.id, files: REFERENCE_CODE, owner: 'reference', at: clock.now() }],
      [{ levelId: EXAMPLE_LEVEL.id, files: PLAYER_CODE, owner: 'player', at: clock.now() }],
    ])
  })

  it("hears nothing when init's version is used without files to load", async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    await level.next()
    await level.next()
    const handler = vi.fn()
    renderHook(() => useCodeReplaced(handler))

    await level.useReference()
    expect(handler).not.toHaveBeenCalled()
  })
})
