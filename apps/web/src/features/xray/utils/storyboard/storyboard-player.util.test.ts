import { describe, expect, it } from 'vitest'
import { INITIAL_PLAYER } from './storyboard-player.constants'
import { guessKey, openingOf, playerReducer } from './storyboard-player.util'

describe('playerReducer', () => {
  it('opens a storyboard where it is told, keeping playback unless told otherwise', () => {
    const playing = { ...INITIAL_PLAYER, playing: true, index: 4 }
    expect(playerReducer(playing, { type: 'load', board: 'b', to: 0 })).toMatchObject({
      board: 'b',
      index: 0,
      playing: true,
    })
    expect(playerReducer(playing, { type: 'load', board: 'b', to: 9, play: false })).toMatchObject({
      index: 9,
      playing: false,
    })
  })

  it('holds the stage before a Predict stage until the guess is in, then shows it', () => {
    const asked = playerReducer(INITIAL_PLAYER, { type: 'goto', to: 8, count: 10, ask: true })
    expect(asked).toMatchObject({ index: 7, pending: 8 })
    expect(playerReducer(asked, { type: 'reveal' })).toMatchObject({ index: 8, pending: null })
  })

  it('never goes past either end', () => {
    expect(playerReducer(INITIAL_PLAYER, { type: 'goto', to: -1, count: 10, ask: false }).index).toBe(0)
    expect(playerReducer(INITIAL_PLAYER, { type: 'goto', to: 99, count: 10, ask: false }).index).toBe(9)
  })
})

describe('openingOf', () => {
  it('lets playback that is already running carry on into the next storyboard', () => {
    expect(openingOf(true, true, false, true)).toBe('continue')
  })

  it('opens a watched storyboard at its end, with no motion', () => {
    expect(openingOf(false, true, true, true)).toBe('end')
  })

  it('plays on its own only the first time at a level step, and never in step mode', () => {
    expect(openingOf(false, false, true, true)).toBe('autoplay')
    expect(openingOf(false, false, false, true)).toBe('start')
    expect(openingOf(false, false, true, false)).toBe('start')
    expect(openingOf(true, false, true, false)).toBe('start')
  })
})

describe('guessKey', () => {
  it('keys a guess by what the storyboard is remembered as, and the stage', () => {
    expect(guessKey('prologue:syscalls:write', 'answer')).toBe('prologue:syscalls:write:answer')
  })
})
