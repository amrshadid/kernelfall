// @vitest-environment jsdom
import { eventBus } from '@kernelfall/core/services'
import { afterEach, describe, expect, it } from 'vitest'
import { type CodeReplacedPayload, GAME_EVENTS } from '#events/types'
import { saveKey } from '#services/utils/save-storage.service'
import { useProgressStore } from '#store/progress.store'
import { EXAMPLE_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'
import { DEFAULT_SAVE_SLOT } from '#types/definitions/saves'

const state = useProgressStore.getState
const record = () => state().progress.levels[0]

describe('useLevelCode', () => {
  afterEach(uninstallTestGame)

  it('keeps the code and lab snapshot in the progress, saved with the next save', async () => {
    const { storage } = installTestGame()
    const { level, code, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    const stored = storage.map.get(saveKey(DEFAULT_SAVE_SLOT))

    expect(code.setCode({ 'a.c': 'mine' }).success).toBe(true)
    expect(code.setLabSnapshot('snap-7').success).toBe(true)
    expect(record()?.code).toEqual({ 'a.c': 'mine' })
    expect(record()?.labSnapshot).toBe('snap-7')
    expect(storage.map.get(saveKey(DEFAULT_SAVE_SLOT))).toBe(stored)
  })

  it("restores the player's code kept by init's version, announces it and saves", async () => {
    const { storage } = installTestGame()
    const { level, code, saves } = renderGameActions()
    await saves.open()
    const replaced: CodeReplacedPayload[] = []
    const subscription = eventBus.on<CodeReplacedPayload>(GAME_EVENTS.CODE_REPLACED, (event) => {
      replaced.push(event.payload)
    })
    await level.start(EXAMPLE_LEVEL.id)
    await level.next()
    await level.next()
    code.setCode({ 'a.c': 'mine' })
    await level.useReference({ 'a.c': 'init' })

    expect((await code.restorePlayerCode()).success).toBe(true)
    expect(record()?.code).toEqual({ 'a.c': 'mine' })
    expect(record()?.playerCode).toBeUndefined()
    expect(replaced.at(-1)).toMatchObject({ owner: 'player', files: { 'a.c': 'mine' } })
    expect(JSON.parse(storage.map.get(saveKey(DEFAULT_SAVE_SLOT)) ?? '').progress).toEqual(state().progress)
    expect((await code.restorePlayerCode()).error?.code).toBe('NOT_FOUND')
    subscription.unsubscribe()
  })

  it('fails, never throws, when no level is active', async () => {
    installTestGame()
    const { code, saves } = renderGameActions()
    await saves.open()
    expect(code.setCode({ 'a.c': '' }).error?.code).toBe('NOT_READY')
    expect(code.setLabSnapshot(null).error?.code).toBe('NOT_READY')
    expect((await code.restorePlayerCode()).error?.code).toBe('NOT_READY')
  })
})
