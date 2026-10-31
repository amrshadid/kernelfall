// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useProgress } from '#hooks/progress/useProgress.hook'
import { saveKey } from '#services/utils/save-storage.service'
import { useProgressStore } from '#store/progress.store'
import { EXAMPLE_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'
import { DEFAULT_SAVE_SLOT, SAVE_ISSUES } from '#types/definitions/saves'
import { GAME_STATUS } from '#types/definitions/store'

describe('useProgress', () => {
  afterEach(uninstallTestGame)

  it('is opening until the save has been loaded', async () => {
    installTestGame()
    const { saves } = renderGameActions()
    const { result } = renderHook(() => useProgress())
    expect(result.current).toMatchObject({ status: GAME_STATUS.closed, isOpening: true, isOpen: false })

    await act(async () => {
      await saves.open()
    })
    expect(result.current).toMatchObject({ status: GAME_STATUS.open, isOpening: false, isOpen: true, saveIssue: null })
  })

  it('is saving while a write is in flight, and keeps the time of the last save', async () => {
    const { clock } = installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    const { result } = renderHook(() => useProgress())

    let started: Promise<unknown> = Promise.resolve()
    act(() => {
      started = level.start(EXAMPLE_LEVEL.id)
    })
    expect(result.current.isSaving).toBe(true)

    await act(async () => {
      await started
    })
    expect(result.current).toMatchObject({ isSaving: false, lastSavedAt: clock.now() })
    expect(result.current.progress).toBe(useProgressStore.getState().progress)
  })

  it("says why progress isn't reaching storage", async () => {
    const { storage } = installTestGame()
    storage.map.set(saveKey(DEFAULT_SAVE_SLOT), 'not a save')
    const { saves } = renderGameActions()
    const { result } = renderHook(() => useProgress())

    await act(async () => {
      await saves.open()
    })
    expect(result.current).toMatchObject({ isOpen: true, saveIssue: SAVE_ISSUES.unreadable })
  })
})
