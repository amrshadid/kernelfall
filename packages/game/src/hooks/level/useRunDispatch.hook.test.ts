// @vitest-environment jsdom
import { eventBus } from '@kernelfall/core/services'
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { GAME_EVENTS } from '#events/types'
import { type UseRunDispatchResult, useRunDispatch } from '#hooks/level/useRunDispatch.hook'
import { saveKey } from '#services/utils/save-storage.service'
import { useProgressStore } from '#store/progress.store'
import {
  EXAMPLE_CHECKER,
  EXAMPLE_LEVEL,
  helloRunEvents,
  installTestGame,
  type MemoryStorage,
  type TestGameOptions,
  uninstallTestGame,
} from '#test/index'
import type { Achievement } from '#types/definitions/achievements'
import { DEFAULT_SAVE_SLOT } from '#types/definitions/saves'
import { ACTIVE_TIME_IDLE_CAP_MS } from '#types/definitions/session'
import { evaluateCheck } from '#utils/checker/index'
import { emptyProgress, findLevelProgress, startLevel } from '#utils/progress/index'

const state = useProgressStore.getState
const KEY = saveKey(DEFAULT_SAVE_SLOT)
const PLAY_MS = 30_000

const renderDispatch = (): UseRunDispatchResult => renderHook(() => useRunDispatch()).result.current

/** A test game with the example level active at its scene, as `useLevelActions().start` leaves it. */
function playing(options: TestGameOptions<MemoryStorage> = {}) {
  const game = installTestGame(options)
  const at = game.clock.now()
  const started = startLevel(emptyProgress(), EXAMPLE_LEVEL, at)
  state().open(started.progress, null, null)
  state().setActive({ level: EXAMPLE_LEVEL, run: started.run }, at)
  return { ...game, ...renderDispatch() }
}

/** Records game events emitted on the core bus, in order. */
function recordGameEvents() {
  const events: { type: string; payload: unknown }[] = []
  const subscription = eventBus.on('GAME_*', (event) => {
    events.push({ type: event.type, payload: event.payload })
  })
  return { events, types: () => events.map((event) => event.type), stop: subscription.unsubscribe }
}

async function toBuild({ dispatchRun }: UseRunDispatchResult): Promise<void> {
  await dispatchRun({ type: 'next' })
  await dispatchRun({ type: 'next' })
}

describe('useRunDispatch: recordActivity', () => {
  afterEach(uninstallTestGame)

  it('counts play time since the last activity, with idle gaps capped', () => {
    const { clock, recordActivity } = playing()
    clock.advance(PLAY_MS)
    recordActivity()
    clock.advance(ACTIVE_TIME_IDLE_CAP_MS * 10)
    recordActivity()

    expect(findLevelProgress(state().progress, EXAMPLE_LEVEL.id)?.activeMs).toBe(PLAY_MS + ACTIVE_TIME_IDLE_CAP_MS)
    expect(state().lastActivityAt).toBe(clock.now())
  })

  it('uses the configured idle cap', () => {
    const cap = 1_000
    const { clock, recordActivity } = playing({ options: { activeTimeIdleCapMs: cap } })
    clock.advance(PLAY_MS)
    recordActivity()

    expect(findLevelProgress(state().progress, EXAMPLE_LEVEL.id)?.activeMs).toBe(cap)
  })

  it('does nothing while no level is active', () => {
    const { clock } = installTestGame()
    const { recordActivity } = renderDispatch()
    const before = state().progress
    clock.advance(PLAY_MS)
    recordActivity()

    expect(state().progress).toBe(before)
    expect(state().lastActivityAt).toBeNull()
  })
})

describe('useRunDispatch: dispatchRun', () => {
  afterEach(uninstallTestGame)

  it('fails when no level is active', async () => {
    installTestGame()
    expect((await renderDispatch().dispatchRun({ type: 'next' })).error?.code).toBe('NOT_READY')
  })

  it("changes and saves nothing for an event that doesn't apply in this phase", async () => {
    const { storage, dispatchRun } = playing()
    const before = state().progress

    const result = await dispatchRun({ type: 'reveal_hint' })
    expect(result).toEqual({ success: true, data: { run: state().active?.run, changed: false, unlocked: [] } })
    expect(state().progress).toBe(before)
    expect(storage.map.has(KEY)).toBe(false)
  })

  it('moves the active run, folds it into the progress and saves it', async () => {
    const { storage, dispatchRun } = playing()

    const result = await dispatchRun({ type: 'next' })
    expect(result.data).toMatchObject({ changed: true, run: { phase: 'see' } })
    expect(state().active?.run.phase).toBe('see')
    expect(state().progress.lastActive).toEqual({ levelId: EXAMPLE_LEVEL.id, phase: 'see' })
    expect(JSON.parse(storage.map.get(KEY) ?? '').progress).toEqual(state().progress)
  })

  it('counts the play time up to the step', async () => {
    const { clock, dispatchRun } = playing()
    clock.advance(PLAY_MS)
    await dispatchRun({ type: 'next' })

    expect(findLevelProgress(state().progress, EXAMPLE_LEVEL.id)?.activeMs).toBe(PLAY_MS)
    expect(state().lastActivityAt).toBe(clock.now())
  })

  it('announces each hint with its tier', async () => {
    const game = playing()
    await toBuild(game)
    const recorded = recordGameEvents()

    await game.dispatchRun({ type: 'reveal_hint' })
    await game.dispatchRun({ type: 'reveal_hint' })

    const hints = recorded.events.filter((event) => event.type === GAME_EVENTS.HINT_REVEALED)
    expect(hints.map((event) => event.payload)).toEqual([
      { levelId: EXAMPLE_LEVEL.id, tier: 'nudge', at: game.clock.now() },
      { levelId: EXAMPLE_LEVEL.id, tier: 'concept', at: game.clock.now() },
    ])
    recorded.stop()
  })

  it('announces the completion with its Taint, then the achievements it earned, then saves', async () => {
    const game = playing()
    await toBuild(game)
    const recorded = recordGameEvents()
    const verdict = evaluateCheck(EXAMPLE_LEVEL, EXAMPLE_CHECKER, {
      events: helloRunEvents({ failedWriteFirst: true }),
    })

    await game.dispatchRun({ type: 'submit', verdict })
    expect(recorded.types()).not.toContain(GAME_EVENTS.LEVEL_COMPLETED)
    const accepted = await game.dispatchRun({ type: 'accept_taint' })

    const completed = recorded.events.find((event) => event.type === GAME_EVENTS.LEVEL_COMPLETED)
    expect(completed?.payload).toMatchObject({
      levelId: EXAMPLE_LEVEL.id,
      via: 'player',
      taint: EXAMPLE_LEVEL.taint[0]?.points,
    })
    expect(accepted.data?.unlocked.map((achievement) => achievement.id)).toEqual(['first-repair', 'on-your-own'])
    expect(recorded.types().slice(-5)).toEqual([
      GAME_EVENTS.LEVEL_COMPLETED,
      GAME_EVENTS.ACHIEVEMENT_UNLOCKED,
      GAME_EVENTS.ACHIEVEMENT_UNLOCKED,
      GAME_EVENTS.PROGRESS_CHANGED,
      GAME_EVENTS.SAVED,
    ])
    recorded.stop()
  })

  it('unlocks from the configured catalog, once', async () => {
    const always: Achievement = { id: 'always', title: 'Always', description: '', isEarned: () => true }
    const { dispatchRun } = playing({ options: { achievements: [always] } })

    const first = await dispatchRun({ type: 'next' })
    const second = await dispatchRun({ type: 'next' })

    expect(first.data?.unlocked).toEqual([always])
    expect(second.data?.unlocked).toEqual([])
    expect(state().progress.achievements.map((achievement) => achievement.id)).toEqual(['always'])
  })
})
