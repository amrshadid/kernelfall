// @vitest-environment jsdom
import { eventBus } from '@kernelfall/core/services'
import type { BootedPayload, CommandFinishedPayload, LabEvent } from '@kernelfall/machine/events'
import { LAB_EVENTS } from '@kernelfall/machine/events'
import type { BootSummary } from '@kernelfall/machine/types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GAME_EVENTS } from '#events/types'
import { useLevelCheck } from '#hooks/level/useLevelCheck.hook'
import { useProgressStore } from '#store/progress.store'
import {
  contentOf,
  EXAMPLE_CHECKER,
  EXAMPLE_LEVEL,
  FOLLOW_UP_LEVEL,
  type GameActions,
  helloRunEvents,
  installTestGame,
  renderGameActions,
  stamped,
  uninstallTestGame,
} from '#test/index'
import type { LevelChecker } from '#types/definitions/checker'

const state = useProgressStore.getState
const finished = (events: readonly LabEvent[]): CommandFinishedPayload => ({
  command: { commandLine: './hello', status: 0 },
  events,
})
/** `./hello` runs and exits with `code`, printing nothing. */
const exitOnly = (code: number): LabEvent[] =>
  stamped([
    { type: 'sched_process_exec', pid: 2, oldPid: 2, filename: './hello' },
    { type: 'sched_process_exit', pid: 2, code },
  ])

/** `gcc` (pid 5) starts cc1 (pid 6), which writes `stderr`; the driver exits with `code`. */
const gcc = (code: number, stderr: string): LabEvent[] =>
  stamped([
    { type: 'sched_process_exec', pid: 5, oldPid: 5, filename: '/usr/bin/gcc' },
    { type: 'sched_process_fork', parentPid: 5, childPid: 6 },
    { type: 'sched_process_exec', pid: 6, oldPid: 6, filename: '/usr/libexec/gcc/i586-alpine-linux-musl/15.2.0/cc1' },
    ...(stderr
      ? [
          { type: 'sys_enter', pid: 6, name: 'write', args: [2, 0, stderr.length], data: stderr } as const,
          { type: 'sys_exit', pid: 6, name: 'write', ret: stderr.length } as const,
        ]
      : []),
    { type: 'sched_process_exit', pid: 6, code },
    { type: 'sched_process_exit', pid: 5, code },
  ])

async function toBuild({ level, saves }: GameActions): Promise<void> {
  await saves.open()
  await level.start(EXAMPLE_LEVEL.id)
  await level.next()
  await level.next()
}

describe('useLevelCheck', () => {
  afterEach(uninstallTestGame)

  it('judges nothing outside "build it"', async () => {
    installTestGame()
    const actions = renderGameActions()
    await actions.saves.open()
    await actions.level.start(EXAMPLE_LEVEL.id)
    const { result } = renderHook(() => useLevelCheck())

    expect(await result.current.check(finished(helloRunEvents()))).toEqual({ success: true, data: null })
    expect(state().active?.run.attempts).toBe(0)
  })

  it('lists every objective as missing before the first judged run', async () => {
    installTestGame()
    await toBuild(renderGameActions())
    const { result } = renderHook(() => useLevelCheck())

    expect(result.current).toMatchObject({ verdict: null, hasChecker: true })
    expect(result.current.missing).toEqual(EXAMPLE_LEVEL.objectives)
  })

  it('submits what is still missing, keeping objectives an earlier run met', async () => {
    installTestGame()
    await toBuild(renderGameActions())
    const { result } = renderHook(() => useLevelCheck())

    let first: Awaited<ReturnType<typeof result.current.check>> | undefined
    await act(async () => {
      first = await result.current.check(finished(exitOnly(0)))
    })
    expect(first?.data?.missing.map((objective) => objective.id)).toEqual(['prints-hello'])
    expect(result.current.missing.map((objective) => objective.id)).toEqual(['prints-hello'])

    // This run fails to exit cleanly, but exits-cleanly stays met.
    await act(async () => {
      await result.current.check(finished(exitOnly(1)))
    })
    expect(result.current.missing.map((objective) => objective.id)).toEqual(['prints-hello'])
    expect(state().active?.run.attempts).toBe(2)
    expect(state().active?.run.phase).toBe('build')
  })

  it("reads the compile's warnings from the command's own events: gcc's cc1 writes them to stderr", async () => {
    installTestGame()
    await toBuild(renderGameActions())
    const spy = vi.spyOn(EXAMPLE_CHECKER, 'check')
    const { result } = renderHook(() => useLevelCheck())

    await act(async () => {
      await result.current.check(
        finished([...gcc(0, "hello.c:4:9: warning: unused variable 'n' [-Wunused-variable]\n"), ...exitOnly(0)])
      )
    })

    expect(spy.mock.calls[0]?.[0].warnings).toEqual([
      {
        message: "unused variable 'n'",
        location: { file: 'hello.c', line: 4, column: 9 },
        flag: '-Wunused-variable',
      },
    ])
    spy.mockRestore()
  })

  it('remembers a build that failed, until a later compile has no errors', async () => {
    installTestGame()
    await toBuild(renderGameActions())
    const spy = vi.spyOn(EXAMPLE_CHECKER, 'check')
    const { result } = renderHook(() => useLevelCheck())
    const judge = (events: readonly LabEvent[]) => act(async () => void (await result.current.check(finished(events))))
    const broken = gcc(1, "hello.c:19:17: error: expected ';' before '}' token\n")

    await judge([...broken, ...exitOnly(0)])
    // A command that compiles nothing keeps the failed build as the latest.
    await judge(exitOnly(0))
    await judge([...gcc(0, ''), ...exitOnly(0)])

    expect(spy.mock.calls.map(([input]) => input.builds)).toEqual([
      { failedEarlier: false, latestErrors: 1 },
      { failedEarlier: true, latestErrors: 1 },
      { failedEarlier: true, latestErrors: 0 },
    ])
    spy.mockRestore()
  })

  it('judges a boot by its summary, with no events and no build', async () => {
    const check = vi.fn(() => ({ objectivesMet: [], taint: [] }))
    const bootChecker: LevelChecker = { applies: ({ boot }) => boot !== undefined, check }
    const content = contentOf([EXAMPLE_LEVEL, FOLLOW_UP_LEVEL], { [EXAMPLE_LEVEL.id]: bootChecker })
    installTestGame({ options: { content } })
    await toBuild(renderGameActions())
    renderHook(() => useLevelCheck())
    const boot: BootSummary = {
      kernel: '/boot/vmlinuz-6.18.0',
      cmdline: 'BOOT_IMAGE=/boot/vmlinuz-6.18.0 root=/dev/vda2 ro quiet',
      firmware: 'uefi',
      outcome: 'init',
      failedStage: null,
      unknownParams: ['BOOT_IMAGE=/boot/vmlinuz-6.18.0'],
      memTotalKb: 502_340,
      pci: [],
      netDevices: ['lo', 'eth0'],
      rootDevice: 'vda2',
    }

    act(() => {
      eventBus.emit<BootedPayload>(LAB_EVENTS.BOOTED, { boot }, { source: 'test' })
    })

    await waitFor(() => expect(check).toHaveBeenCalledWith({ events: [], boot }))
  })

  it("judges each finished command from the lab's events, and a clean pass completes the level", async () => {
    installTestGame()
    await toBuild(renderGameActions())
    const completed: unknown[] = []
    const subscription = eventBus.on(GAME_EVENTS.LEVEL_COMPLETED, (event) => {
      completed.push(event.payload)
    })
    const { result } = renderHook(() => useLevelCheck())

    act(() => {
      eventBus.emit(LAB_EVENTS.COMMAND_FINISHED, finished(helloRunEvents()), { source: 'test' })
    })

    await waitFor(() => expect(state().active?.run.phase).toBe('watch'))
    expect(result.current.verdict?.passed).toBe(true)
    expect(completed).toEqual([expect.objectContaining({ levelId: EXAMPLE_LEVEL.id, via: 'player', taint: 0 })])
    subscription.unsubscribe()
  })

  it('holds a pass with Taint, says what added it, and finishes as is on request', async () => {
    installTestGame()
    const actions = renderGameActions()
    await toBuild(actions)
    const { result } = renderHook(() => useLevelCheck())

    await act(async () => {
      await result.current.check(finished(helloRunEvents({ failedWriteFirst: true })))
    })

    expect(state().active?.run.phase).toBe('build')
    expect(result.current.heldTaint.map((event) => event.ruleId).length).toBeGreaterThan(0)
    await act(async () => {
      await actions.level.acceptTaint()
    })
    expect(state().active?.run).toMatchObject({ phase: 'watch', outcome: { via: 'player' } })
    expect(state().progress.levels[0]?.lastResult?.taint).toBe(2)
  })

  it('lets the player fix it first and finish clean with the next run', async () => {
    installTestGame()
    const actions = renderGameActions()
    await toBuild(actions)
    const { result } = renderHook(() => useLevelCheck())

    await act(async () => {
      await result.current.check(finished(helloRunEvents({ failedWriteFirst: true })))
      await actions.level.fixFirst()
    })
    expect(state().active?.run).toMatchObject({ phase: 'build', heldPass: null })
    expect(result.current.heldTaint).toEqual([])

    await act(async () => {
      await result.current.check(finished(helloRunEvents()))
    })
    expect(state().active?.run.phase).toBe('watch')
    expect(state().progress.levels[0]?.lastResult?.taint).toBe(0)
  })
})
