// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useKernelMap } from '#hooks/map/useKernelMap.hook'
import {
  EXAMPLE_CHECKER,
  EXAMPLE_LEVEL,
  FOLLOW_UP_LEVEL,
  helloRunEvents,
  installTestGame,
  renderGameActions,
  uninstallTestGame,
} from '#test/index'
import { evaluateCheck } from '#utils/checker/index'

describe('useKernelMap', () => {
  afterEach(uninstallTestGame)

  it('lists every level in content order with its status, record and Taint', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    const { result } = renderHook(() => useKernelMap())
    expect(result.current.levels.map((entry) => entry.status)).toEqual(['available', 'locked'])

    await act(async () => {
      await level.start(EXAMPLE_LEVEL.id)
      await level.next()
      await level.next()
      const events = helloRunEvents({ failedWriteFirst: true })
      await level.submit(evaluateCheck(EXAMPLE_LEVEL, EXAMPLE_CHECKER, { events }))
      await level.acceptTaint()
    })

    expect(result.current.levels.map((entry) => [entry.level.id, entry.status, entry.taint, entry.isPlayable])).toEqual(
      [
        [EXAMPLE_LEVEL.id, 'completed', 2, true],
        [FOLLOW_UP_LEVEL.id, 'available', 0, true],
      ]
    )
    expect(result.current.byId.get(EXAMPLE_LEVEL.id)?.record?.attempts).toBe(1)
    expect(result.current.unlockedSkills.has('write-to-stdout')).toBe(true)
  })
})
