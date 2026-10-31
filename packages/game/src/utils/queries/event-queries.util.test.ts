import { describe, expect, it } from 'vitest'
import { shellSession } from '#test/index'
import { asText, basename, eventsBetween, eventsOf } from '#utils/queries/event-queries.util'

describe('asText', () => {
  it('reads each byte as one character, and nothing as empty text', () => {
    expect(asText(Uint8Array.from([0x68, 0x69, 0x0a]))).toBe('hi\n')
    expect(asText(undefined)).toBe('')
  })
})

describe('basename', () => {
  it('keeps the last part of a path', () => {
    expect(basename('/bin/ls')).toBe('ls')
    expect(basename('./ksh')).toBe('ksh')
    expect(basename('hello')).toBe('hello')
  })
})

describe('eventsOf and eventsBetween', () => {
  it('picks one type of event, in order', () => {
    expect(eventsOf(shellSession(), 'sched_process_exec').map((event) => event.filename)).toEqual([
      './ksh',
      '/bin/ls',
      '/bin/sh',
    ])
  })

  it('keeps the events strictly between two seqs', () => {
    expect(eventsBetween(shellSession(), 12, 15).map((event) => event.seq)).toEqual([13, 14])
  })
})
