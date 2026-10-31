// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useLevelCheck } from '#hooks/level/useLevelCheck.hook'
import { useRunAsCues } from '#hooks/level/useRunAsCues.hook'
import {
  contentOf,
  EXAMPLE_LEVEL,
  FOLLOW_UP_LEVEL,
  helloRunEvents,
  installTestGame,
  renderGameActions,
  uninstallTestGame,
} from '#test/index'
import type { LevelChecker } from '#types/definitions/checker'
import type { LevelDefinition, RunAsCue } from '#types/definitions/level'

const KNOCK: RunAsCue = { after: 'prints-hello', user: 'guest', command: 'cat /home/you/notes.txt' }
const LEVEL: LevelDefinition = { ...EXAMPLE_LEVEL, runAs: [KNOCK] }
// Meets the cue's objective only, so the level stays in "build it".
const HALF_CHECKER: LevelChecker = { check: () => ({ objectivesMet: ['prints-hello'], taint: [] }) }
const finished = { command: { commandLine: './hello', status: 0 }, events: helloRunEvents() }

describe('useRunAsCues', () => {
  afterEach(uninstallTestGame)

  it('runs a cue once, when its objective is first met, not on the verdicts after', async () => {
    installTestGame({ options: { content: contentOf([LEVEL, FOLLOW_UP_LEVEL], { [LEVEL.id]: HALF_CHECKER }) } })
    const { saves, level } = renderGameActions()
    await saves.open()
    await level.start(LEVEL.id)
    await level.next()
    await level.next()
    const run = vi.fn()
    renderHook(() => useRunAsCues(run))
    const { result } = renderHook(() => useLevelCheck())
    expect(run).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.check(finished)
    })
    await act(async () => {
      await result.current.check(finished)
    })

    expect(run).toHaveBeenCalledOnce()
    expect(run).toHaveBeenCalledWith(KNOCK)
  })
})
