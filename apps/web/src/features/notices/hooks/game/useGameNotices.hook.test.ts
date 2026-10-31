// @vitest-environment jsdom
import { NOTICE_MS } from '@features/notices/utils/notices'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameNotices } from './useGameNotices.hook'

// The game's event hooks, faked so the test can fire their events.
const game = vi.hoisted(() => ({
  completed: (_payload: unknown) => {},
  unlocked: (_payload: unknown) => {},
  saveFailed: (_payload: unknown) => {},
}))

vi.mock('@kernelfall/game/hooks', () => ({
  useLevelCompleted: (handler: (payload: unknown) => void) => {
    game.completed = handler
  },
  useAchievementUnlocked: (handler: (payload: unknown) => void) => {
    game.unlocked = handler
  },
  useSaveFailed: (handler: (payload: unknown) => void) => {
    game.saveFailed = handler
  },
}))

const titleOf = (levelId: string) => `Level ${levelId}`

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useGameNotices', () => {
  it("shows the game's notices one at a time, each fading once it is on show", () => {
    const { result } = renderHook(() => useGameNotices(titleOf))
    act(() => {
      game.completed({ levelId: 'p', via: 'player', score: 100, taint: 0, at: 1 })
      game.unlocked({ achievementId: 'a', title: 'First words', at: 2 })
    })
    expect(result.current.notice?.text).toBe('Level p · score 100 · Taint 0, clean')
    expect(result.current.waiting).toBe(1)

    act(() => {
      vi.advanceTimersByTime(NOTICE_MS)
    })
    expect(result.current.notice?.text).toBe('First words')
    expect(result.current.waiting).toBe(0)
  })

  it('keeps a failed save until the player dismisses it', () => {
    const { result } = renderHook(() => useGameNotices(titleOf))
    act(() => game.saveFailed({ issue: 'write_failed', at: 1 }))
    act(() => {
      vi.advanceTimersByTime(NOTICE_MS * 2)
    })
    const failed = result.current.notice
    expect(failed?.kind).toBe('save-failed')

    act(() => result.current.dismiss(failed?.id ?? ''))
    expect(result.current.notice).toBeUndefined()
  })
})
