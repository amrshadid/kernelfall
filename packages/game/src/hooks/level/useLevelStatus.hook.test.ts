// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useLevelStatus } from '#hooks/level/useLevelStatus.hook'
import { EXAMPLE_LEVEL, FOLLOW_UP_LEVEL, installTestGame, renderGameActions, uninstallTestGame } from '#test/index'

describe('useLevelStatus', () => {
  afterEach(uninstallTestGame)

  it('takes a level from available to in progress to completed, unlocking the next', async () => {
    installTestGame()
    const { level, saves } = renderGameActions()
    await saves.open()
    const { result } = renderHook(() => ({
      first: useLevelStatus(EXAMPLE_LEVEL.id),
      next: useLevelStatus(FOLLOW_UP_LEVEL.id),
    }))
    expect(result.current.first).toEqual({ status: 'available', record: undefined, isPlayable: true })
    expect(result.current.next).toEqual({ status: 'locked', record: undefined, isPlayable: false })

    await act(async () => {
      await level.start(EXAMPLE_LEVEL.id)
    })
    expect(result.current.first).toMatchObject({ status: 'in_progress', record: { levelId: EXAMPLE_LEVEL.id } })

    await act(async () => {
      await level.next()
      await level.next()
      await level.useReference()
    })
    expect(result.current.first.status).toBe('completed')
    expect(result.current.next).toMatchObject({ status: 'available', isPlayable: true })
  })

  it('treats an id the content does not know as locked', () => {
    installTestGame()
    const { result } = renderHook(() => useLevelStatus('act1-nowhere-01-missing'))

    expect(result.current).toEqual({ status: 'locked', record: undefined, isPlayable: false })
  })

  it('follows a change of level id', () => {
    installTestGame()
    const { result, rerender } = renderHook(({ id }) => useLevelStatus(id), { initialProps: { id: EXAMPLE_LEVEL.id } })
    expect(result.current.status).toBe('available')

    rerender({ id: FOLLOW_UP_LEVEL.id })
    expect(result.current.status).toBe('locked')
  })
})
