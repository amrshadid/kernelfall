import type { PlaybackSpeed, PlayerState } from '@features/xray/types'

/** At 1×: long enough to read a stage's first sentence. */
export const STAGE_MS = 4200

export const SPEEDS: readonly PlaybackSpeed[] = [0.5, 1, 2]

export const INITIAL_PLAYER: PlayerState = { board: null, index: 0, pending: null, playing: false, speed: 1 }
