// @vitest-environment jsdom
import { eventBus } from '@kernelfall/core/services'
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { GAME_EVENTS } from '#events/types'
import { useAnnounceProgress } from '#hooks/saves/useAnnounceProgress.hook'
import { saveKey } from '#services/utils/save-storage.service'
import { useProgressStore } from '#store/progress.store'
import { installTestGame, uninstallTestGame } from '#test/index'
import { DEFAULT_SAVE_SLOT } from '#types/definitions/saves'

describe('useAnnounceProgress', () => {
  afterEach(uninstallTestGame)

  it('announces the change and resolves once autosave has stored it', async () => {
    const { storage, clock } = installTestGame()
    const { announceProgress } = renderHook(() => useAnnounceProgress()).result.current
    const events: { type: string; payload: unknown; source: string | undefined }[] = []
    const subscription = eventBus.on(GAME_EVENTS.PROGRESS_CHANGED, (event) => {
      events.push({ type: event.type, payload: event.payload, source: event.metadata.source })
    })

    await announceProgress('game/test')

    expect(events).toEqual([{ type: GAME_EVENTS.PROGRESS_CHANGED, payload: { at: clock.now() }, source: 'game/test' }])
    expect(JSON.parse(storage.map.get(saveKey(DEFAULT_SAVE_SLOT)) ?? '').progress).toEqual(
      useProgressStore.getState().progress
    )
    subscription.unsubscribe()
  })
})
