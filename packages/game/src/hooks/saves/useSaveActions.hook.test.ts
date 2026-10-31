// @vitest-environment jsdom
import { eventBus } from '@kernelfall/core/services'
import type { ServiceResponse } from '@kernelfall/core/types'
import { afterEach, describe, expect, it } from 'vitest'
import { getContent } from '#config'
import { GAME_EVENTS } from '#events/types'
import { saveKey } from '#services/utils/save-storage.service'
import { useProgressStore } from '#store/progress.store'
import {
  createFailingStorage,
  EXAMPLE_CHECKER,
  EXAMPLE_LEVEL,
  FOLLOW_UP_LEVEL,
  helloRunEvents,
  installTestGame,
  renderGameActions,
  uninstallTestGame,
} from '#test/index'
import { DEFAULT_SAVE_SLOT, SAVE_ISSUES } from '#types/definitions/saves'
import { ACTIVE_TIME_IDLE_CAP_MS } from '#types/definitions/session'
import { evaluateCheck } from '#utils/checker/evaluate-check.util'
import { collectCodex } from '#utils/codex/index'
import { continueTarget, findLevelProgress, levelStatusById } from '#utils/progress/index'
import { readSaveFile } from '#utils/saves/index'
import { summarizeProgress } from '#utils/summary/index'

const state = useProgressStore.getState
const SLOT_KEY = saveKey(DEFAULT_SAVE_SLOT)

/** The data of a response that must have succeeded. */
async function data<T>(response: Promise<ServiceResponse<T>>): Promise<T> {
  const result = await response
  if (!result.success || result.data === undefined) {
    throw new Error(result.error?.message ?? 'no data')
  }
  return result.data
}

/** Records the names of game events emitted on the core bus, in order. */
function recordGameEvents() {
  const names: string[] = []
  const subscription = eventBus.on('GAME_*', (event) => {
    names.push(event.type)
  })
  return { names, stop: subscription.unsubscribe }
}

function storedProgress(raw: string | undefined) {
  const loaded = readSaveFile(raw === undefined ? undefined : JSON.parse(raw))
  if (!loaded.ok) {
    throw new Error(loaded.errors.join('\n'))
  }
  return loaded.value.progress
}

describe('useSaveActions with useLevelActions: the game flow', () => {
  afterEach(uninstallTestGame)

  it('autosaves every step so a reopened game resumes where it left off', async () => {
    const { storage, clock } = installTestGame()
    const { level, code, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    await level.next()
    await level.next()
    await level.revealHint()
    code.setCode({ 'hello.c': 'int main(void) { return 0; }' })
    code.setLabSnapshot('snap-7')
    expect((await saves.saveNow()).success).toBe(true)

    installTestGame({ storage, clock })
    await saves.open()
    expect(continueTarget(state().progress, getContent())).toEqual({
      levelId: EXAMPLE_LEVEL.id,
      phase: 'build',
    })
    const resumed = await data(level.start(EXAMPLE_LEVEL.id))
    expect(resumed).toMatchObject({ phase: 'build', hintsRevealed: 1 })
    expect(findLevelProgress(state().progress, EXAMPLE_LEVEL.id)).toMatchObject({
      code: { 'hello.c': 'int main(void) { return 0; }' },
      labSnapshot: 'snap-7',
    })
  })

  it('plays the example level end to end with checker, Taint, codex, achievements and events', async () => {
    const { storage } = installTestGame()
    const { level, saves } = renderGameActions()
    const events = recordGameEvents()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    await level.next()
    await level.next()
    const crashed = await data(level.oops({ text: 'BUG: unable to handle page fault' }))
    expect(crashed.unlocked.map((achievement) => achievement.id)).toEqual(['first-oops'])
    await level.respawn()

    const verdict = evaluateCheck(EXAMPLE_LEVEL, EXAMPLE_CHECKER, {
      events: helloRunEvents({ failedWriteFirst: true }),
    })
    const held = await data(level.submit(verdict))
    expect(held.run.phase).toBe('build')
    const passed = await data(level.acceptTaint())
    expect(passed.run.phase).toBe('watch')
    expect(passed.unlocked.map((achievement) => achievement.id)).toEqual(['first-repair', 'on-your-own'])

    await level.next()
    await level.next()
    const content = getContent()
    const { progress } = state()
    expect(state().active?.run.phase).toBe('complete')
    expect(collectCodex(progress, content).map((entry) => entry.card.id)).toEqual(['write-syscall'])
    expect(levelStatusById(progress, content, FOLLOW_UP_LEVEL.id)).toBe('available')
    expect(continueTarget(progress, content)).toEqual({
      levelId: FOLLOW_UP_LEVEL.id,
      phase: 'scene',
    })
    expect(summarizeProgress(progress, content)).toMatchObject({
      overall: { completed: 1, total: 2, percent: 50 },
      codexCards: 1,
      achievements: 3,
    })
    expect(storedProgress(storage.map.get(SLOT_KEY))).toEqual(progress)
    expect(events.names).toEqual(
      expect.arrayContaining([
        GAME_EVENTS.OPENED,
        GAME_EVENTS.LEVEL_STARTED,
        GAME_EVENTS.ACHIEVEMENT_UNLOCKED,
        GAME_EVENTS.LEVEL_COMPLETED,
        GAME_EVENTS.SAVED,
      ])
    )
    // Autosave reports the write after the change that caused it.
    expect(events.names.indexOf(GAME_EVENTS.SAVED)).toBeGreaterThan(events.names.indexOf(GAME_EVENTS.PROGRESS_CHANGED))
    events.stop()
  })

  it("doesn't change or save anything for an event that doesn't apply", async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    const before = state().progress
    const result = await data(level.respawn())
    expect(result.changed).toBe(false)
    expect(state().progress).toBe(before)
  })

  it('counts active time with idle gaps capped', async () => {
    const { clock } = installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    clock.advance(30_000)
    await level.next()
    clock.advance(ACTIVE_TIME_IDLE_CAP_MS * 10)
    level.recordActivity()
    expect(findLevelProgress(state().progress, EXAMPLE_LEVEL.id)?.activeMs).toBe(30_000 + ACTIVE_TIME_IDLE_CAP_MS)
  })

  it('refuses unknown and locked levels', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    expect(await level.start('nope')).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'unknown level "nope"' },
    })
    expect(await level.start(FOLLOW_UP_LEVEL.id)).toEqual({
      success: false,
      error: { code: 'FORBIDDEN', message: `level "${FOLLOW_UP_LEVEL.id}" is locked` },
    })
  })

  it('exports, imports and resets', async () => {
    const { storage } = installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    await level.next()
    const exported = saves.exportSave()

    await saves.reset()
    expect(state().progress.levels).toEqual([])
    expect(state().active).toBeNull()
    expect(storage.map.has(SLOT_KEY)).toBe(false)

    const imported = await saves.importSave(exported)
    expect(imported.success).toBe(true)
    expect(continueTarget(state().progress, getContent())).toEqual({
      levelId: EXAMPLE_LEVEL.id,
      phase: 'see',
    })
    expect(storedProgress(storage.map.get(SLOT_KEY)).levels).toHaveLength(1)
    const garbage = await saves.importSave('garbage')
    expect(garbage.error?.code).toBe('VALIDATION_ERROR')
  })

  it("opens empty and never overwrites a save it can't read", async () => {
    const corrupt = JSON.stringify({ format: 'kernelfall-save', version: 'x' })
    const { storage } = installTestGame()
    const { level, saves } = renderGameActions()
    storage.map.set(SLOT_KEY, corrupt)

    const opened = await saves.open()
    expect(opened.error?.code).toBe('VALIDATION_ERROR')
    expect(state().saveIssue).toBe(SAVE_ISSUES.unreadable)
    expect(state().progress.levels).toEqual([])

    await level.start(EXAMPLE_LEVEL.id)
    const saved = await saves.saveNow()
    expect(saved.error?.code).toBe('UNAVAILABLE')
    expect(storage.map.get(SLOT_KEY)).toBe(corrupt)
  })

  it('keeps playing from memory and says so when storage refuses the save', async () => {
    installTestGame({ storage: createFailingStorage() })
    const { level, saves } = renderGameActions()
    const events = recordGameEvents()
    await saves.open()

    const started = await level.start(EXAMPLE_LEVEL.id)
    expect(started.success).toBe(true)
    expect(state().saveIssue).toBe(SAVE_ISSUES.writeFailed)
    expect(state().active?.run.levelId).toBe(EXAMPLE_LEVEL.id)
    expect(events.names).toContain(GAME_EVENTS.SAVE_FAILED)
    expect((await saves.saveNow()).error?.code).toBe('UNAVAILABLE')
    events.stop()
  })
})
