// @vitest-environment jsdom
import type { LevelRunState } from '@kernelfall/game/types'
import { createLevelRun } from '@kernelfall/game/utils'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLevelRun } from './useLevelRun.hook'

const LEVEL = 'act1-process-district-04-run-anything'

const game = vi.hoisted(() => ({
  start: vi.fn(),
  active: { level: undefined as { id: string } | undefined, run: null as LevelRunState | null },
}))

vi.mock('@kernelfall/game/hooks', () => ({
  useLevelActions: () => ({ start: game.start }),
  useActiveLevel: () => game.active,
}))

describe('useLevelRun', () => {
  beforeEach(() => {
    game.start.mockReset()
    game.active = { level: undefined, run: null }
  })

  it('starts the level and is opening until the run is the active one', async () => {
    game.start.mockResolvedValue({ success: true })
    const { result, rerender } = renderHook(() => useLevelRun(LEVEL))
    expect(result.current).toEqual({ status: 'opening' })
    expect(game.start).toHaveBeenCalledWith(LEVEL)

    const run = createLevelRun(LEVEL)
    game.active = { level: { id: LEVEL }, run }
    rerender()
    expect(result.current).toEqual({ status: 'ready', run })
  })

  it("is opening while another level's run is still the active one", () => {
    game.start.mockResolvedValue({ success: true })
    game.active = { level: { id: 'another-level' }, run: createLevelRun('another-level') }
    const { result } = renderHook(() => useLevelRun(LEVEL))
    expect(result.current).toEqual({ status: 'opening' })
  })

  it('says a level is locked when the player lacks its skills, and missing otherwise', async () => {
    game.start.mockResolvedValue({ success: false, error: { code: 'FORBIDDEN', message: 'locked' } })
    const locked = renderHook(() => useLevelRun(LEVEL))
    await waitFor(() => expect(locked.result.current).toEqual({ status: 'unavailable', reason: 'locked' }))

    game.start.mockResolvedValue({ success: false, error: { code: 'NOT_FOUND', message: 'no level' } })
    const missing = renderHook(() => useLevelRun('nope'))
    await waitFor(() => expect(missing.result.current).toEqual({ status: 'unavailable', reason: 'missing' }))
  })
})
