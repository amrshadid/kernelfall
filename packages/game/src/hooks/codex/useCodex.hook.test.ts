// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useCodex } from '#hooks/codex/useCodex.hook'
import { EXAMPLE_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'

describe('useCodex', () => {
  afterEach(uninstallTestGame)

  it("files a level's cards once the player passes it, and not before", async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    const { result } = renderHook(() => useCodex())
    expect(result.current).toEqual([])

    await act(async () => {
      await level.start(EXAMPLE_LEVEL.id)
      await level.next()
      await level.next()
    })
    expect(result.current).toEqual([])

    await act(async () => {
      await level.useReference()
    })
    expect(result.current.map((entry) => [entry.card.id, entry.levelId])).toEqual([['write-syscall', EXAMPLE_LEVEL.id]])
  })

  it('keeps the same list while the progress is unchanged', async () => {
    installTestGame()
    await renderGameActions().saves.open()
    const { result, rerender } = renderHook(() => useCodex())
    const first = result.current

    rerender()
    expect(result.current).toBe(first)
  })
})
