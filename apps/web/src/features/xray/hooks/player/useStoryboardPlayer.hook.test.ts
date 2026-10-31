// @vitest-environment jsdom
import type { Stage } from '@features/xray/types'
import { STAGE_MS } from '@features/xray/utils/storyboard'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type StoryboardPlayerOptions, useStoryboardPlayer } from './useStoryboardPlayer.hook'

const stage = (key: string, predict = false): Stage<null> => ({
  key,
  tick: key,
  title: key,
  what: '',
  why: '',
  deeper: '',
  sources: [],
  scene: null,
  ...(predict && { predict: { question: 'Which?', options: ['a', 'b'], answer: 'a', explain: '' } }),
})

const STAGES = [stage('one'), stage('two', true), stage('three')]

function player(overrides: Partial<StoryboardPlayerOptions> = {}) {
  const options: StoryboardPlayerOptions = {
    storyboardKey: 'board',
    stages: STAGES,
    animate: true,
    predict: false,
    memoryKey: 'level:syscalls:write',
    seen: false,
    autoplay: false,
    guesses: {},
    onGuess: vi.fn(),
    onSeen: vi.fn(),
    onAutoplayed: vi.fn(),
    ...overrides,
  }
  return {
    options,
    hook: renderHook((props: StoryboardPlayerOptions) => useStoryboardPlayer(props), { initialProps: options }),
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useStoryboardPlayer', () => {
  it('waits at the first stage and steps by hand', () => {
    const { hook } = player()
    expect(hook.result.current).toMatchObject({ index: 0, playing: false })
    act(() => hook.result.current.forward())
    expect(hook.result.current.index).toBe(1)
    act(() => hook.result.current.back())
    expect(hook.result.current.index).toBe(0)
  })

  it('plays on its own the first time, a stage at a time', () => {
    const { hook, options } = player({ autoplay: true })
    expect(options.onAutoplayed).toHaveBeenCalled()
    expect(hook.result.current.playing).toBe(true)
    act(() => vi.advanceTimersByTime(STAGE_MS))
    expect(hook.result.current.index).toBe(1)
  })

  it('opens a storyboard the player has seen at its end', () => {
    const { hook, options } = player({ seen: true })
    expect(hook.result.current.index).toBe(2)
    expect(options.onSeen).toHaveBeenCalled()
  })

  it('asks for a guess before a Predict stage, remembers it, and plays the stage after', () => {
    const { hook, options } = player({ predict: true })
    act(() => hook.result.current.forward())
    expect(hook.result.current).toMatchObject({ index: 0, pending: 1, current: 1 })
    act(() => hook.result.current.guess('b'))
    expect(options.onGuess).toHaveBeenCalledWith('level:syscalls:write:two', 'b')
    act(() => hook.result.current.reveal())
    expect(hook.result.current).toMatchObject({ index: 1, pending: null })
  })

  it('shows a guess made before', () => {
    const { hook } = player({ guesses: { 'level:syscalls:write:two': 'a' } })
    expect(hook.result.current.guessAt(1)).toBe('a')
    expect(hook.result.current.guessAt(0)).toBeNull()
  })

  it('hands on to the next storyboard when playback runs off the end', () => {
    const onFinished = vi.fn()
    const { hook } = player({ onFinished })
    act(() => hook.result.current.togglePlay())
    // One stage per tick: each timer is set once the stage before it is on screen.
    act(() => vi.advanceTimersByTime(STAGE_MS))
    act(() => vi.advanceTimersByTime(STAGE_MS))
    expect(hook.result.current.index).toBe(2)
    expect(onFinished).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(STAGE_MS))
    expect(onFinished).toHaveBeenCalled()
  })

  it('never plays in step mode', () => {
    const { hook } = player({ animate: false, autoplay: true })
    act(() => hook.result.current.togglePlay())
    expect(hook.result.current.playing).toBe(false)
    act(() => hook.result.current.setSpeed(2))
    expect(hook.result.current.speed).toBe(2)
  })
})
