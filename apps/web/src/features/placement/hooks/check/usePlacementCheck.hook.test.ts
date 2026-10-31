// @vitest-environment jsdom
import type { GameContent, PlacementCheck } from '@kernelfall/game/types'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePlacementCheck } from './usePlacementCheck.hook'

const CHECK: PlacementCheck = {
  offer: 'Show me.',
  minutes: 8,
  tasks: [
    { levelId: 'p5', task: 'uname', files: [], objectives: ['asks-uname'] },
    { levelId: 'p6', task: 'driver', files: [], objectives: ['reads-disk-driver'] },
  ],
}

// Each level's checker meets its objective when the command made that level's syscall.
const CONTENT = {
  checker: (levelId: string) => ({
    check: ({ events }: { events: readonly { type: string; name?: string }[] }) => ({
      objectivesMet: events.some((event) => event.name === (levelId === 'p5' ? 'uname' : 'readlink'))
        ? [levelId === 'p5' ? 'asks-uname' : 'reads-disk-driver']
        : [],
      taint: [],
    }),
  }),
} as unknown as GameContent

const call = (name: string) => [{ type: 'sys_enter', name }] as never

function open() {
  const place = vi.fn(async () => undefined)
  const hook = renderHook(() => usePlacementCheck({ content: CONTENT, check: CHECK, place }))
  return { ...hook, place }
}

describe('usePlacementCheck', () => {
  it('opens on the offer and judges nothing before the tasks begin', () => {
    const { result } = open()
    expect(result.current.step).toBe('offer')
    act(() => result.current.judge(call('uname')))
    expect(result.current.progress.size).toBe(0)
  })

  it("judges each command against every task's level and places the player past the passed ones", async () => {
    const { result, place } = open()
    act(() => result.current.begin())
    act(() => result.current.judge(call('uname')))
    expect(result.current.progress.get('p5')?.has('asks-uname')).toBe(true)
    await act(async () => result.current.finish())
    expect(place).toHaveBeenCalledWith({ placed: ['p5'], sendTo: 'p6' })
    expect(result.current.step).toBe('result')
  })

  it('starts over on a retake', async () => {
    const { result } = open()
    act(() => result.current.begin())
    act(() => result.current.judge(call('uname')))
    await act(async () => result.current.finish())
    act(() => result.current.retake())
    expect(result.current).toMatchObject({ step: 'tasks', index: 0, result: null })
    expect(result.current.progress.size).toBe(0)
  })

  it('moves between tasks within the check', () => {
    const { result } = open()
    act(() => result.current.goTo(5))
    expect(result.current.index).toBe(1)
  })
})
