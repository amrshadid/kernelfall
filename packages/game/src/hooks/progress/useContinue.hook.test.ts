// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useContinue } from '#hooks/progress/useContinue.hook'
import { EXAMPLE_LEVEL, FOLLOW_UP_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'

describe('useContinue', () => {
  afterEach(uninstallTestGame)

  it('goes to the first playable level on a new game, then to the step the player left', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    const { result } = renderHook(() => useContinue())
    expect(result.current).toEqual({ levelId: EXAMPLE_LEVEL.id, phase: 'scene' })

    await act(async () => {
      await level.start(EXAMPLE_LEVEL.id)
      await level.next()
      await level.next()
    })
    expect(result.current).toEqual({ levelId: EXAMPLE_LEVEL.id, phase: 'build' })
  })

  it('moves on to the level a completion unlocked', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    const { result } = renderHook(() => useContinue())

    await act(async () => {
      await level.start(EXAMPLE_LEVEL.id)
      await level.next()
      await level.next()
      await level.useReference()
      await level.next()
      await level.next()
    })
    expect(result.current).toEqual({ levelId: FOLLOW_UP_LEVEL.id, phase: 'scene' })
  })
})
