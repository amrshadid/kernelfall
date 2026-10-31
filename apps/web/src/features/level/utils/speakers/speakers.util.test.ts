import { describe, expect, it } from 'vitest'
import { speakerOf } from './speakers.util'

describe('speakerOf', () => {
  it('names the cast with the real thing they stand for', () => {
    expect(speakerOf('init')).toMatchObject({ term: 'PID 1, the first userspace process', portrait: 'init' })
    expect(speakerOf('The Watchdog')).toMatchObject({ term: 'watchdog timer', portrait: 'watchdog' })
  })

  it('lets narration and unknown names speak without a portrait', () => {
    expect(speakerOf(null)).toMatchObject({ id: 'narrator', portrait: null })
    expect(speakerOf('A Stranger')).toEqual({ id: 'A Stranger', name: 'A Stranger', term: '', portrait: null })
  })
})
