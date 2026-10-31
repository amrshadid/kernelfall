import type { PlaybackSpeed, PlayerState } from '@features/xray/types'

export type PlayerAction =
  /** Another storyboard: open it at `to`, and start or stop playing if `play` says so. */
  | { readonly type: 'load'; readonly board: string; readonly to: number; readonly play?: boolean }
  /** `ask` (only moving forward): collect a guess first, with the stage before still up. */
  | { readonly type: 'goto'; readonly to: number; readonly count: number; readonly ask: boolean }
  | { readonly type: 'play' }
  | { readonly type: 'pause' }
  | { readonly type: 'speed'; readonly speed: PlaybackSpeed }
  /** Play the pending stage: after a guess, or without one (a guess is never required). */
  | { readonly type: 'reveal' }

export type Opening = 'continue' | 'end' | 'autoplay' | 'start'

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'load':
      return {
        ...state,
        board: action.board,
        index: Math.max(0, action.to),
        pending: null,
        playing: action.play ?? state.playing,
      }
    case 'goto': {
      const to = Math.max(0, Math.min(action.to, action.count - 1))
      if (action.ask && to > 0) {
        return { ...state, index: to - 1, pending: to }
      }
      return { ...state, index: to, pending: null }
    }
    case 'play':
      return { ...state, playing: true }
    case 'pause':
      return { ...state, playing: false }
    case 'speed':
      return { ...state, speed: action.speed }
    case 'reveal':
      return state.pending === null ? state : { ...state, index: state.pending, pending: null }
  }
}

/** Running playback carries on; a watched one opens at its end; the first at a level step plays itself. */
export function openingOf(playing: boolean, seen: boolean, autoplay: boolean, animate: boolean): Opening {
  if (playing && animate) {
    return 'continue'
  }
  if (seen) {
    return 'end'
  }
  return autoplay && animate ? 'autoplay' : 'start'
}

export function guessKey(memoryKey: string, stage: string): string {
  return `${memoryKey}:${stage}`
}
