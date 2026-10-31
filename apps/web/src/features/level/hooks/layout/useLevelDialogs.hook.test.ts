// @vitest-environment jsdom
import type { LevelPhase } from '@kernelfall/game/types'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useLevelDialogs } from './useLevelDialogs.hook'

afterEach(cleanup)

describe('useLevelDialogs', () => {
  it('toggles a look back at a step, and a new step ends it', () => {
    const { result, rerender } = renderHook(({ phase }: { phase: LevelPhase }) => useLevelDialogs(phase), {
      initialProps: { phase: 'build' },
    })
    act(() => result.current.toggleReview('scene'))
    expect(result.current.reviewing).toBe('scene')
    act(() => result.current.toggleReview('scene'))
    expect(result.current.reviewing).toBeNull()

    act(() => result.current.review('see'))
    rerender({ phase: 'watch' })
    expect(result.current.reviewing).toBeNull()
  })

  it('opens and closes the Taint, reference and replay dialogs', () => {
    const { result } = renderHook(() => useLevelDialogs('build'))
    act(() => result.current.setTaintOpen(true))
    act(() => result.current.setReferenceOpen(true))
    act(() => result.current.setReplayOpen(true))
    expect(result.current.taintOpen).toBe(true)
    expect(result.current.referenceOpen).toBe(true)
    expect(result.current.replayOpen).toBe(true)
    act(() => result.current.setTaintOpen(false))
    expect(result.current.taintOpen).toBe(false)
  })
})
