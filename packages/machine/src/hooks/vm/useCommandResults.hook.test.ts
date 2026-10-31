// @vitest-environment jsdom
import { eventBus } from '@kernelfall/core/services'
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { type CommandFinishedPayload, type CommandProgressPayload, LAB_EVENTS } from '#events/types'
import { type CommandResult, useCommandResults } from '#hooks/vm/useCommandResults.hook'

const fork = { type: 'sched_process_fork', parentPid: 434, childPid: 441, cpu: 0, seq: 0, time: 1 } as const

const finish = (commandLine: string, status: number) =>
  eventBus.emit<CommandFinishedPayload>(
    LAB_EVENTS.COMMAND_FINISHED,
    { command: { commandLine, status }, events: [fork] },
    { source: 'test' }
  )

describe('useCommandResults', () => {
  afterEach(() => {
    eventBus.removeAllListeners()
  })

  it('hands each finished command to the latest callback, and ignores commands still running', () => {
    const first: CommandResult[] = []
    const latest: CommandResult[] = []
    const { rerender, unmount } = renderHook(({ seen }) => useCommandResults((result) => seen.push(result)), {
      initialProps: { seen: first },
    })

    eventBus.emit<CommandProgressPayload>(
      LAB_EVENTS.COMMAND_PROGRESS,
      { command: { commandLine: 'uname' }, events: [fork] },
      { source: 'test' }
    )
    finish('uname', 0)
    rerender({ seen: latest })
    finish('ls /nope', 1)
    unmount()
    finish('ignored', 0)

    expect(first).toEqual([{ commandLine: 'uname', status: 0, events: [fork] }])
    expect(latest).toEqual([{ commandLine: 'ls /nope', status: 1, events: [fork] }])
  })
})
