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
      { command: { commandLine: './hello' }, events: EVENTS.slice(0, 2) },
      SOURCE
    )
    expect(useTraceStore.getState().runs).toMatchObject([{ commandLine: './hello', running: true }])
  })

  it('stops recording after cleanup', () => {
    cleanupMachineListeners()
    finished()
    expect(useTraceStore.getState().runs).toEqual([])
  })
})
