// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useActiveLevel } from '#hooks/level/useActiveLevel.hook'
import {
  EXAMPLE_CHECKER,
  EXAMPLE_LEVEL,
  type GameActions,
  helloRunEvents,
  installTestGame,
  renderGameActions,
  uninstallTestGame,
} from '#test/index'
import { evaluateCheck } from '#utils/checker/index'

async function toBuild({ level, saves }: GameActions): Promise<void> {
  await saves.open()
  await level.start(EXAMPLE_LEVEL.id)
  await level.next()
  await level.next()
}

const taintedPass = () =>
  evaluateCheck(EXAMPLE_LEVEL, EXAMPLE_CHECKER, { events: helloRunEvents({ failedWriteFirst: true }) })

describe('useActiveLevel', () => {
  afterEach(uninstallTestGame)

  it('has no level, phase or allowed events before a level starts', () => {
    installTestGame()
    const { result } = renderHook(() => useActiveLevel())

    expect(result.current).toMatchObject({
      level: null,
      run: null,
      phase: null,
      canRevealHint: false,
      isComplete: false,
      taint: 0,
      taintEntries: [],
    })
    expect(result.current.allowed.size).toBe(0)
  })

  it('allows only the events that do something in the current phase', async () => {
    installTestGame()
    const actions = renderGameActions()
    await actions.saves.open()
    const { result } = renderHook(() => useActiveLevel())

    await act(async () => {
      await actions.level.start(EXAMPLE_LEVEL.id)
    })
    expect(result.current.level).toBe(EXAMPLE_LEVEL)
    expect(result.current.phase).toBe('scene')
    expect([...result.current.allowed]).toEqual(['next'])

    await act(async () => {
      await actions.level.next()
      await actions.level.next()
    })
    expect(result.current.phase).toBe('build')
    expect(result.current.canRevealHint).toBe(true)
    expect(result.current.allowed.has('next')).toBe(false)
  })

  it('shows no Taint while a tainted pass waits for the player, then its points once accepted', async () => {
    installTestGame()
    const actions = renderGameActions()
    await toBuild(actions)
    const { result } = renderHook(() => useActiveLevel())

    await act(async () => {
      await actions.level.submit(taintedPass())
    })
    expect(result.current.allowed.has('accept_taint')).toBe(true)
    expect(result.current).toMatchObject({ taint: 0, taintEntries: [] })

    await act(async () => {
      await actions.level.acceptTaint()
    })
    const [rule] = EXAMPLE_LEVEL.taint
    expect(result.current.taint).toBe(rule?.points)
    expect(result.current.taintEntries.map((entry) => entry.ruleId)).toEqual([rule?.id])
  })

  it('is complete after the card', async () => {
    installTestGame()
    const actions = renderGameActions()
    await toBuild(actions)
    const { result } = renderHook(() => useActiveLevel())

    await act(async () => {
      await actions.level.useReference()
      await actions.level.next()
      await actions.level.next()
    })
    expect(result.current).toMatchObject({ phase: 'complete', isComplete: true, taint: 0 })
    expect(result.current.allowed.size).toBe(0)
  })
})
