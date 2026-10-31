// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useProgressSummary } from '#hooks/summary/useProgressSummary.hook'
import {
  EXAMPLE_CHECKER,
  EXAMPLE_LEVEL,
  helloRunEvents,
  installTestGame,
  renderGameActions,
  uninstallTestGame,
} from '#test/index'
import { evaluateCheck } from '#utils/checker/index'

const LEVEL_COUNT = 2

describe('useProgressSummary', () => {
  afterEach(uninstallTestGame)

  it('summarizes a new game, then counts a passed level, its card, skills, achievements and Taint', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    const { result } = renderHook(() => useProgressSummary())
    expect(result.current).toMatchObject({
      overall: { completed: 0, total: LEVEL_COUNT, percent: 0 },
      codexCards: 0,
      achievements: 0,
      totalTaint: 0,
      projectedEnding: 'clean_reboot',
    })

    await act(async () => {
      await level.start(EXAMPLE_LEVEL.id)
      await level.next()
      await level.next()
      await level.submit(
        evaluateCheck(EXAMPLE_LEVEL, EXAMPLE_CHECKER, { events: helloRunEvents({ failedWriteFirst: true }) })
      )
      await level.acceptTaint()
    })
    expect(result.current).toMatchObject({
      overall: { completed: 1, total: LEVEL_COUNT, percent: 50 },
      skills: { completed: EXAMPLE_LEVEL.skills.length },
      codexCards: EXAMPLE_LEVEL.codex.length,
      totalTaint: EXAMPLE_LEVEL.taint[0]?.points,
    })
    expect(result.current.achievements).toBeGreaterThan(0)
  })

  it('projects the ending with the configured Taint thresholds', () => {
    installTestGame({ options: { cleanRebootMaxTaint: -1, unstableRebootMaxTaint: -1 } })
    const { result } = renderHook(() => useProgressSummary())

    // With no Taint allowed at all, even an empty ledger is above both thresholds.
    expect(result.current.projectedEnding).toBe('dangling_survives')
  })
})
