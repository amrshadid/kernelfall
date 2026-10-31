import { configureCore, resetCoreConfig } from '@kernelfall/core'
import { eventBus } from '@kernelfall/core/services'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanupMachineListeners, setupMachineListeners } from '#events/listeners'
import type { CommandFinishedPayload, CommandProgressPayload } from '#events/types'
import { LAB_EVENTS } from '#events/types'
import { useTraceStore } from '#store/trace.store'
import { HELLO_RUN, stamp } from '#test/trace-events'

const EVENTS = stamp(HELLO_RUN)
const SOURCE = { source: 'machine/test' }

const finished = () =>
  eventBus.emit<CommandFinishedPayload>(
    LAB_EVENTS.COMMAND_FINISHED,
    { command: { commandLine: './hello', status: 0 }, events: EVENTS },
    SOURCE
  )

describe('machine listeners', () => {
  beforeEach(setupMachineListeners)
  afterEach(() => {
    cleanupMachineListeners()
    useTraceStore.getState().reset()
  })

  it('records a finished command in the trace', () => {
    finished()
    expect(useTraceStore.getState().runs).toMatchObject([{ commandLine: './hello', status: 0 }])
  })

  it('shows a running command as a live run', () => {
    eventBus.emit<CommandProgressPayload>(
      LAB_EVENTS.COMMAND_PROGRESS,
      { command: { commandLine: './hello' }, from: 0, events: EVENTS.slice(0, 2) },
      SOURCE
    )
    expect(useTraceStore.getState().runs).toMatchObject([{ commandLine: './hello', running: true }])
  })

  // `find /` is ~47k events: whole-run updates kept on the bus and logged grew the heap past 1.6 GB.
  it('follows a huge command from updates that carry only what changed, retaining each event about once', () => {
    const retained: unknown[] = []
    const sink = { debug: (...args: unknown[]) => retained.push(args), info() {}, warn() {}, error() {} }
    configureCore({ logEvents: {}, logLevel: 'debug', logSink: sink })
    const all = stamp(
      Array.from({ length: 50_000 }, (_, i) =>
        i % 2 === 0
          ? ({ type: 'sys_enter', pid: 7, nr: 383, name: 'statx', args: [0, 0, 0, 0, 0] } as const)
          : ({ type: 'sys_exit', pid: 7, nr: 383, name: 'statx', ret: 0 } as const)
      )
    )
    let carried = 0
    for (let from = 0; from < all.length; from += 500) {
      // Each update also completes the previous one's last event, as a late probe does.
      const start = Math.max(0, from - 1)
      const events = all.slice(start, from + 500)
      carried += events.length
      eventBus.emit<CommandProgressPayload>(
        LAB_EVENTS.COMMAND_PROGRESS,
        { command: { commandLine: 'find /' }, from: start, events },
        SOURCE
      )
    }
    resetCoreConfig()

    const { runs, eventsByRun } = useTraceStore.getState()
    expect(runs).toMatchObject([{ commandLine: 'find /', running: true }])
    expect(runs[0]?.calls).toHaveLength(25_000)
    expect(eventsByRun[runs[0]?.id ?? 0]).toEqual(all)
    expect(carried).toBeLessThan(all.length * 1.01)
    const kept = eventBus
      .getHistory()
      .reduce((sum, event) => sum + ((event.payload as CommandProgressPayload).events?.length ?? 0), 0)
    expect(kept).toBeLessThanOrEqual(100 * 501)
  })

  it('drops an update for a run whose start it never saw', () => {
    eventBus.emit<CommandProgressPayload>(
      LAB_EVENTS.COMMAND_PROGRESS,
      { command: { commandLine: './hello' }, from: 4, events: EVENTS.slice(4) },
      SOURCE
    )
    expect(useTraceStore.getState().runs).toEqual([])
  })

  it('stops recording after cleanup', () => {
    cleanupMachineListeners()
    finished()
    expect(useTraceStore.getState().runs).toEqual([])
  })
})
