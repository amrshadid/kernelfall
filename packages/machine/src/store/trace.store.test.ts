import { afterEach, describe, expect, it } from 'vitest'
import { useTraceStore } from '#store/trace.store'
import { HELLO_RUN, stamp } from '#test/trace-events'

const state = useTraceStore.getState
const EVENTS = stamp(HELLO_RUN)

describe('useTraceStore', () => {
  afterEach(() => state().reset())

  it('records a finished command as a run, with its events', () => {
    state().record(EVENTS, { commandLine: './hello', status: 0 })

    expect(state().runs).toHaveLength(1)
    expect(state().runs[0]).toMatchObject({ id: 1, commandLine: './hello', pid: 7 })
    expect(state().runs[0]?.running).toBeUndefined()
    expect(state().eventsByRun[1]).toBe(EVENTS)
  })

  it('follows a running command, then replaces its live run when it finishes', () => {
    state().follow(0, EVENTS.slice(0, 2), './hello')
    expect(state().runs).toHaveLength(1)
    expect(state().runs[0]).toMatchObject({ id: 1, running: true, status: 0 })

    state().follow(2, EVENTS.slice(2, 5), './hello')
    expect(state().runs).toHaveLength(1)
    expect(state().runs[0]?.calls).toHaveLength(2)
    expect(state().eventsByRun[1]).toEqual(EVENTS.slice(0, 5))

    // A late probe completes an event already sent: the update starts there.
    const completed = { ...EVENTS[2], args: [0x11, 1] } as (typeof EVENTS)[number]
    state().follow(2, [completed, ...EVENTS.slice(3, 6)], './hello')
    expect(state().eventsByRun[1]).toEqual([...EVENTS.slice(0, 2), completed, ...EVENTS.slice(3, 6)])
    expect(state().runs[0]?.calls[1]?.args).toEqual([0x11, 1])

    state().record(EVENTS, { commandLine: './hello', status: 3 })
    expect(state().runs).toHaveLength(1)
    expect(state().runs[0]).toMatchObject({ id: 1, status: 3 })
    expect(state().runs[0]?.running).toBeUndefined()
    expect(state().eventsByRun[1]).toBe(EVENTS)
  })

  it('ends a live run whose command never finished when the next one starts', () => {
    state().follow(0, EVENTS.slice(0, 2), './hello')
    const next = stamp(HELLO_RUN, 100)
    state().record(next, { commandLine: './hello', status: 0 })

    expect(state().runs.map((run) => [run.id, run.running])).toEqual([
      [1, false],
      [2, undefined],
    ])
  })

  it('ignores an update with no events and a blank command line', () => {
    state().follow(0, [], './hello')
    state().follow(3, EVENTS.slice(3), './hello')
    state().record([], { commandLine: '', status: 0 })
    expect(state().runs).toEqual([])
  })

  it('forgets everything on reset', () => {
    state().record(EVENTS, { commandLine: './hello', status: 0 })
    state().reset()
    expect(state()).toMatchObject({ runs: [], eventsByRun: {} })
  })
})
