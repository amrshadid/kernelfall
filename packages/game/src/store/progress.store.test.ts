import { beforeEach, describe, expect, it } from 'vitest'
import { useProgressStore } from '#store/progress.store'
import { EXAMPLE_LEVEL } from '#test/index'
import { SAVE_ISSUES } from '#types/definitions/saves'
import { GAME_STATUS } from '#types/definitions/store'
import { emptyProgress, startLevel } from '#utils/progress/index'
import { createLevelRun } from '#utils/runner/index'

const state = useProgressStore.getState
const SAVED_AT = 1_000
const LATER = 2_000

const started = () => startLevel(emptyProgress(), EXAMPLE_LEVEL, SAVED_AT).progress
const activeExample = () => ({ level: EXAMPLE_LEVEL, run: createLevelRun(EXAMPLE_LEVEL.id) })

describe('useProgressStore', () => {
  beforeEach(() => state().reset())

  it('starts closed and empty', () => {
    expect(state()).toMatchObject({
      status: GAME_STATUS.closed,
      progress: emptyProgress(),
      active: null,
      lastActivityAt: null,
      pendingSaves: 0,
      lastSavedAt: null,
      saveIssue: null,
    })
  })

  it('moves the epoch on when opening starts, so a load begun earlier is seen as stale', () => {
    const before = state().epoch
    state().opening()
    expect(state()).toMatchObject({ status: GAME_STATUS.opening, epoch: before + 1 })
  })

  it('opens with the loaded progress, closing the active level but keeping writes in flight', () => {
    state().setActive(activeExample(), SAVED_AT)
    state().saveStarted()
    const before = state().epoch
    const progress = started()

    state().open(progress, SAVED_AT, SAVE_ISSUES.unreadable)

    expect(state()).toMatchObject({
      status: GAME_STATUS.open,
      progress,
      active: null,
      lastActivityAt: null,
      lastSavedAt: SAVED_AT,
      saveIssue: SAVE_ISSUES.unreadable,
      pendingSaves: 1,
      epoch: before + 1,
    })
  })

  it('replaces the progress, the active level and the activity time without touching the epoch', () => {
    const epoch = state().epoch
    const progress = started()

    state().setProgress(progress)
    expect(state().progress).toBe(progress)

    const active = activeExample()
    state().setActive(active, SAVED_AT)
    expect(state()).toMatchObject({ active, lastActivityAt: SAVED_AT })

    const touched = { ...progress, completionOrder: [EXAMPLE_LEVEL.id] }
    state().touch(touched, LATER)
    expect(state()).toMatchObject({ progress: touched, lastActivityAt: LATER, active })
    expect(state().epoch).toBe(epoch)
  })

  it('counts writes in flight and keeps the last save time when one fails', () => {
    state().saveStarted()
    state().saveStarted()
    expect(state().pendingSaves).toBe(2)

    state().saveFinished(SAVED_AT, null)
    expect(state()).toMatchObject({ pendingSaves: 1, lastSavedAt: SAVED_AT, saveIssue: null })

    state().saveFinished(null, SAVE_ISSUES.writeFailed)
    expect(state()).toMatchObject({ pendingSaves: 0, lastSavedAt: SAVED_AT, saveIssue: SAVE_ISSUES.writeFailed })
  })

  it('never counts writes in flight below zero', () => {
    state().saveFinished(SAVED_AT, null)
    expect(state().pendingSaves).toBe(0)
  })

  it('resets to the initial state but keeps counting the epoch, so work from before the reset stays stale', () => {
    state().open(started(), SAVED_AT, null)
    state().setActive(activeExample(), SAVED_AT)
    state().saveStarted()
    const before = state().epoch

    state().reset()

    expect(state()).toMatchObject({
      status: GAME_STATUS.closed,
      progress: emptyProgress(),
      active: null,
      pendingSaves: 0,
      lastSavedAt: null,
      epoch: before + 1,
    })
  })
})
