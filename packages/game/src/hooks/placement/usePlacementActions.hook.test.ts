// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePlacementActions } from '#hooks/placement/usePlacementActions.hook'
import { useProgressStore } from '#store/progress.store'
import { EXAMPLE_LEVEL, FOLLOW_UP_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'
import { findLevelProgress } from '#utils/progress/index'

describe('usePlacementActions', () => {
  afterEach(uninstallTestGame)

  it('completes the levels of the passed tasks by placement, and saves', async () => {
    const { storage } = installTestGame()
    const { saves } = renderGameActions()
    await act(async () => {
      await saves.open()
    })
    const { result } = renderHook(() => usePlacementActions())

    let placed: Awaited<ReturnType<typeof result.current.place>> | undefined
    await act(async () => {
      placed = await result.current.place({ placed: [EXAMPLE_LEVEL.id], sendTo: FOLLOW_UP_LEVEL.id })
    })

    expect(placed).toEqual({ success: true, data: [EXAMPLE_LEVEL.id] })
    const progress = useProgressStore.getState().progress
    expect(findLevelProgress(progress, EXAMPLE_LEVEL.id)?.lastResult?.via).toBe('placement')
    expect(findLevelProgress(progress, FOLLOW_UP_LEVEL.id)).toBeUndefined()
    expect([...storage.map.values()].some((saved) => saved.includes('"placement"'))).toBe(true)
  })
})
