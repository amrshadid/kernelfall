import type { PlaybackSpeed, Stage } from '@features/xray/types'
import { guessKey, INITIAL_PLAYER, openingOf, playerReducer, STAGE_MS } from '@features/xray/utils/storyboard'
import { useEffect, useReducer, useRef } from 'react'

export interface StoryboardPlayerOptions {
  /** Changes when another storyboard is loaded. */
  readonly storyboardKey: string
  readonly stages: readonly Stage<unknown>[]
  /** False in step mode: no timer, no playing on its own; the player steps by hand. */
  readonly animate: boolean
  readonly predict: boolean
  /** What the player remembers this storyboard by, across runs and reloads: `<level>:<view>:<kind>`. */
  readonly memoryKey: string
  /** The player has watched (or skipped through) this storyboard before: it opens at its end. */
  readonly seen: boolean
  /** It may play on its own when it loads: the first time at this level step. */
  readonly autoplay: boolean
  /** Remembered Predict answers, by guessKey(memoryKey, stage). */
  readonly guesses: Readonly<Record<string, string>>
  onGuess(key: string, option: string): void
  /** The last stage was reached. */
  onSeen(): void
  /** It started playing on its own. */
  onAutoplayed(): void
  /** Called when playback runs off the end, e.g. to go on to the next call. */
  readonly onFinished?: (() => void) | undefined
}

export interface StoryboardPlayer {
  readonly index: number
  /** The stage the transport marks: the pending one while a guess is asked. */
  readonly current: number
  /** The stage waiting for a guess, if any. */
  readonly pending: number | null
  readonly playing: boolean
  readonly speed: PlaybackSpeed
  guessAt(index: number): string | null
  goto(index: number): void
  forward(): void
  back(): void
  togglePlay(): void
  replay(): void
  setSpeed(speed: PlaybackSpeed): void
  guess(option: string): void
  /** Play the pending stage, guessed or not. */
  reveal(): void
}

/**
 * Pauses before a Predict stage until the player guesses or skips. What was watched and answered
 * is remembered outside, so a reload or a revisit doesn't play it at the player again.
 */
export function useStoryboardPlayer(options: StoryboardPlayerOptions): StoryboardPlayer {
  const { storyboardKey, stages, animate, predict, memoryKey, guesses } = options
  const [state, dispatch] = useReducer(playerReducer, INITIAL_PLAYER)
  const count = stages.length
  const latest = useRef(options)
  latest.current = options
  // The storyboard already opened: re-renders and hot reloads must not open it again.
  const opened = useRef<string | null>(null)
  // Playback ran off the end and asked for the next storyboard.
  const handedOn = useRef(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: opening happens once per storyboard
  useEffect(() => {
    if (count === 0 || opened.current === storyboardKey) {
      return
    }
    opened.current = storyboardKey
    const { seen, autoplay, onAutoplayed } = latest.current
    const board = storyboardKey
    // Only playback that ran off the end of the previous storyboard carries on into this one.
    const continuing = handedOn.current && state.playing
    handedOn.current = false
    switch (openingOf(continuing, seen, autoplay, animate)) {
      case 'continue':
        dispatch({ type: 'load', board, to: 0 })
        break
      case 'end':
        dispatch({ type: 'load', board, to: count - 1, play: false })
        break
      case 'autoplay':
        dispatch({ type: 'load', board, to: 0, play: true })
        onAutoplayed()
        break
      case 'start':
        dispatch({ type: 'load', board, to: 0, play: false })
        break
    }
  }, [storyboardKey, count])

  const keyAt = (i: number) => guessKey(memoryKey, stages[i]?.key ?? '')
  const guessAt = (i: number) => guesses[keyAt(i)] ?? null
  const asks = (to: number, from: number) =>
    predict && to > from && stages[to]?.predict !== undefined && guessAt(to) === null
  // Until the load lands, an index from the previous storyboard may be out of range.
  const index = Math.min(state.index, Math.max(count - 1, 0))
  const pending = state.pending !== null && state.pending < count ? state.pending : null
  const goto = (to: number) => dispatch({ type: 'goto', to, count, ask: asks(to, index) })
  const playing = animate && state.playing

  // Reaching the end, by watching or by skipping ahead, counts as seen.
  useEffect(() => {
    if (count > 0 && index === count - 1 && pending === null && state.board === storyboardKey) {
      latest.current.onSeen()
    }
  }, [index, pending, count, storyboardKey, state.board])

  // biome-ignore lint/correctness/useExhaustiveDependencies: the timer restarts on every stage, speed or pause change
  useEffect(() => {
    if (!playing || pending !== null || count === 0) {
      return
    }
    const timer = setTimeout(() => {
      if (index < count - 1) {
        goto(index + 1)
      } else if (latest.current.onFinished) {
        handedOn.current = true
        latest.current.onFinished()
      } else {
        dispatch({ type: 'pause' })
      }
    }, STAGE_MS / state.speed)
    return () => clearTimeout(timer)
  }, [playing, pending, index, state.speed, count, storyboardKey])

  return {
    index,
    current: pending ?? index,
    pending,
    playing,
    speed: state.speed,
    guessAt,
    goto,
    forward: () => (pending !== null ? dispatch({ type: 'reveal' }) : goto(index + 1)),
    back: () => dispatch({ type: 'goto', to: index - 1, count, ask: false }),
    togglePlay: () => {
      if (state.playing) {
        dispatch({ type: 'pause' })
        return
      }
      if (index >= count - 1 && pending === null) {
        dispatch({ type: 'goto', to: 0, count, ask: false })
      }
      dispatch({ type: 'play' })
    },
    replay: () => {
      dispatch({ type: 'goto', to: 0, count, ask: false })
      if (animate) {
        dispatch({ type: 'play' })
      }
    },
    setSpeed: (speed) => dispatch({ type: 'speed', speed }),
    guess: (option) => {
      if (pending !== null) {
        latest.current.onGuess(keyAt(pending), option)
      }
    },
    reveal: () => dispatch({ type: 'reveal' }),
  }
}
