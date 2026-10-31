// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useHints } from '#hooks/hints/useHints.hook'
import { useProgressStore } from '#store/progress.store'
import { EXAMPLE_LEVEL, type GameActions, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'
import { HINT_COSTS, HINT_TIERS } from '#types/definitions/hints'

const [nudge, concept, spot] = EXAMPLE_LEVEL.hints

async function toBuild({ level, saves }: GameActions): Promise<void> {
  await saves.open()
  await level.start(EXAMPLE_LEVEL.id)
  await level.next()
  await level.next()
}

describe('useHints', () => {
  afterEach(uninstallTestGame)

  it('offers nothing to reveal while no level is active', () => {
    installTestGame()
    const { result } = renderHook(() => useHints())

    expect(result.current).toMatchObject({ revealed: [], next: 'nudge', nextCost: HINT_COSTS.nudge, canReveal: false })
  })

  it('reveals hints only while building', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    await level.start(EXAMPLE_LEVEL.id)
    const { result } = renderHook(() => useHints())

    expect(result.current.canReveal).toBe(false)
    let response: Awaited<ReturnType<typeof result.current.reveal>> | undefined
    await act(async () => {
      response = await result.current.reveal()
    })
    expect(response?.data?.changed).toBe(false)
    expect(result.current.revealed).toEqual([])
  })

  it("shows init's hints in tier order with the cost of the next, until all three are out", async () => {
    installTestGame()
    await toBuild(renderGameActions())
    const { result } = renderHook(() => useHints())
    expect(result.current.canReveal).toBe(true)

    await act(async () => {
      await result.current.reveal()
    })
    expect(result.current).toMatchObject({
      revealed: [{ tier: 'nudge', text: nudge }],
      next: 'concept',
      nextCost: HINT_COSTS.concept,
    })

    await act(async () => {
      await result.current.reveal()
      await result.current.reveal()
    })
    expect(result.current.revealed).toEqual([
      { tier: 'nudge', text: nudge },
      { tier: 'concept', text: concept },
      { tier: 'spot', text: spot },
    ])
    expect(result.current).toMatchObject({ next: null, nextCost: 0, canReveal: false })
    expect(useProgressStore.getState().active?.run.hintsRevealed).toBe(HINT_TIERS.length)
  })

  it('prices the next hint with the configured costs', () => {
    const hintCosts = { nudge: 1, concept: 2, spot: 3 }
    installTestGame({ options: { hintCosts } })
    const { result } = renderHook(() => useHints())

    expect(result.current.nextCost).toBe(hintCosts.nudge)
  })
})
