import type { LevelRunState } from '@kernelfall/game/types'
import { createLevelRun } from '@kernelfall/game/utils'
import { describe, expect, it, vi } from 'vitest'
import { type GuideActionsInput, guideActionsOf } from './level-actions.util'

const ALL_HINTS = 3

function input(fields: Partial<GuideActionsInput> = {}): GuideActionsInput {
  const done = vi.fn(async () => ({ success: true }) as const)
  return {
    moves: { next: done, fixFirst: done, acceptTaint: done, respawn: done },
    askReference: vi.fn(),
    heldWithTaint: false,
    nextKeys: 'Alt+N',
    restart: null,
    ...fields,
  } as GuideActionsInput
}

const at = (phase: LevelRunState['phase'], fields: Partial<LevelRunState> = {}): LevelRunState => ({
  ...createLevelRun('level'),
  phase,
  ...fields,
})

const ids = (run: LevelRunState, fields: Partial<GuideActionsInput> = {}) =>
  guideActionsOf(run, input(fields)).map((action) => action.id)

describe('guideActionsOf', () => {
  it('moves on through the story with the Next shortcut shown, and lets the scene be skipped', () => {
    const [next, skip] = guideActionsOf(at('scene'), input())
    expect(next).toMatchObject({ id: 'next', label: 'Next: See it', kind: 'primary', keys: 'Alt+N' })
    expect(skip?.id).toBe('skip')
    expect(ids(at('see'))).toEqual(['next'])
    expect(ids(at('watch'))).toEqual(['next'])
  })

  it('skips the scene with two steps, to Build it', () => {
    const moves = input()
    guideActionsOf(at('scene'), moves)[1]?.onSelect()
    expect(moves.moves.next).toHaveBeenCalledTimes(2)
  })

  it('offers nothing while building until the player has a choice to make', () => {
    expect(ids(at('build'))).toEqual([])
    expect(ids(at('build'), { heldWithTaint: true })).toEqual(['fix-first', 'accept-taint'])
  })

  it("offers init's version once every hint is out: never a dead end", () => {
    const moves = input()
    const actions = guideActionsOf(at('build', { hintsRevealed: ALL_HINTS }), moves)
    expect(actions.map((action) => action.id)).toEqual(['reference'])
    actions[0]?.onSelect()
    expect(moves.askReference).toHaveBeenCalledOnce()
  })

  it('lets a boot level restart the Machine while building, since the player may not reboot', () => {
    const restart = vi.fn()
    const actions = guideActionsOf(at('build'), input({ restart }))
    expect(actions.map((action) => action.id)).toEqual(['restart'])
    actions[0]?.onSelect()
    expect(restart).toHaveBeenCalledOnce()
    expect(ids(at('build', { hintsRevealed: ALL_HINTS }), { restart })).toEqual(['restart', 'reference'])
    expect(ids(at('watch'), { restart })).toEqual(['next'])
  })

  it('restores after an oops and offers nothing on the card', () => {
    expect(ids(at('oops'))).toEqual(['respawn'])
    expect(ids(at('card'))).toEqual([])
    expect(ids(at('complete'))).toEqual([])
  })
})
