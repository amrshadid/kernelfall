// @vitest-environment jsdom
import { eventBus } from '@kernelfall/core/services'
import { afterEach, describe, expect, it } from 'vitest'
import { type CodeReplacedPayload, GAME_EVENTS } from '#events/types'
import { saveKey } from '#services/utils/save-storage.service'
import { useProgressStore } from '#store/progress.store'
import { createMemoryStorage, EXAMPLE_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'
import { DEFAULT_SAVE_SLOT } from '#types/definitions/saves'

const state = useProgressStore.getState

describe('useLevelActions', () => {
  afterEach(uninstallTestGame)

  it('starts empty and notifies store subscribers of every applied event', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    expect(state().progress.levels).toEqual([])
    const phases: (string | undefined)[] = []
    const stop = useProgressStore.subscribe((current) => phases.push(current.active?.run.phase))

    await level.start(EXAMPLE_LEVEL.id)
    await level.next()
    stop()
    expect(state().active?.run.phase).toBe('see')
    expect(phases).toContain('see')
  })

  it('replays a level from its scene, where a start resumes it', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    await level.next()
    await level.start(EXAMPLE_LEVEL.id)
    expect(state().active?.run.phase).toBe('see')

    await level.replay(EXAMPLE_LEVEL.id)
    expect(state().active?.run.phase).toBe('scene')
    expect(state().progress.levels[0]?.run?.phase).toBe('scene')
  })

  it('writes every applied event to storage, in order', async () => {
    const memory = createMemoryStorage()
    const key = saveKey(DEFAULT_SAVE_SLOT)
    const phases: (string | undefined)[] = []
    const recording = {
      ...memory,
      setItem: async (name: string, value: string) => {
        if (name === key) {
          phases.push(JSON.parse(value).progress.levels[0]?.run?.phase)
        }
        await memory.setItem(name, value)
      },
    }
    installTestGame({ storage: recording })
    const { level, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    await Promise.all([level.next(), level.next()])
    expect(phases).toEqual(['scene', 'see', 'build'])
  })

  it("loads init's version, keeps the player's code and announces the swap", async () => {
    installTestGame()
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
    const record = state().progress.levels[0]
    expect(state().active?.run.phase).toBe('watch')
    expect(record?.code).toEqual({ 'a.c': 'init' })
    expect(record?.playerCode).toEqual({ 'a.c': 'mine' })
    expect(replaced.map(({ owner, files }) => [owner, files])).toEqual([['reference', { 'a.c': 'init' }]])
    subscription.unsubscribe()
  })

  it("leaves the code alone when init's version doesn't apply", async () => {
    installTestGame()
    const { level, code, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    code.setCode({ 'a.c': 'mine' })
    const result = await level.useReference({ 'a.c': 'init' })
    expect(result.data?.changed).toBe(false)
    expect(state().progress.levels[0]?.code).toEqual({ 'a.c': 'mine' })
  })

  it('fails, never throws, when a move needs a level and none is active', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    expect((await level.next()).error?.code).toBe('NOT_READY')
    expect((await level.useReference()).error?.code).toBe('NOT_READY')
  })
})
