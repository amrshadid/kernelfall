import { describe, expect, it } from 'vitest'
import { HELLO_RUN, stamp } from '#test/trace-events'
import { MAX_TRACE_RUNS } from '#types/definitions/trace'
import { appendRun, buildRun, findCall } from '#utils/trace/syscall-trace.util'

const HELLO = { commandLine: './hello', status: 0 }

describe('buildRun', () => {
  it('pairs each sys_enter with what ended it, following forked children like strace -f', () => {
    const run = buildRun(1, stamp(HELLO_RUN), HELLO)

    expect(run).toMatchObject({ id: 1, commandLine: './hello', status: 0, pid: 7, exitCode: 0 })
    expect(run.calls.map((call) => [call.id, call.pid, call.name, call.result])).toEqual([
      [0, 7, 'write', { kind: 'returned', ret: 3 }],
      [2, 7, 'clone', { kind: 'returned', ret: 8 }],
      [5, 8, 'exit_group', { kind: 'exited' }],
      [8, 7, 'exit_group', { kind: 'exited' }],
    ])
  })

  it('keeps the buffer a call read', () => {
    const [write] = buildRun(1, stamp(HELLO_RUN), HELLO).calls
    expect(write?.data).toEqual(Uint8Array.from([0x68, 0x69, 0x0a]))
  })

  it('keeps the buffer read() filled, from its exit', () => {
    const data = Uint8Array.from([0x6f, 0x6b])
    const run = buildRun(
      1,
      stamp([
        { type: 'sys_enter', pid: 7, nr: 3, name: 'read', args: [0, 0x1000, 64] },
        { type: 'sys_exit', pid: 7, nr: 3, name: 'read', ret: 2, data },
      ]),
      HELLO
    )
    expect(run.calls[0]?.data).toEqual(data)
  })

  it("follows the task that forks the command even when init's event comes first", () => {
    const run = buildRun(
      1,
      stamp([{ type: 'signal_generate', pid: 1, sig: 17, result: 'delivered' }, ...HELLO_RUN]),
      HELLO
    )
    expect(run.pid).toBe(7)
    expect(run.calls.map((call) => call.name)).toEqual(['write', 'clone', 'exit_group', 'exit_group'])
  })

  it('leaves out other tasks, such as init reaping the command', () => {
    const run = buildRun(1, stamp(HELLO_RUN), HELLO)
    expect(run.calls.some((call) => call.pid === 1)).toBe(false)
  })

  it('leaves a call without its sys_exit pending, and exitCode null for a process still running', () => {
    const run = buildRun(1, stamp(HELLO_RUN.slice(0, 1)), HELLO)
    expect(run.calls[0]?.result).toEqual({ kind: 'pending' })
    expect(run.exitCode).toBeNull()
  })

  it('has no pid and no calls for a command that made no events', () => {
    expect(buildRun(1, [], HELLO)).toMatchObject({ pid: null, calls: [], exitCode: null })
  })
})

describe('appendRun', () => {
  it('numbers runs after the last one', () => {
    const first = appendRun([], stamp(HELLO_RUN), HELLO)
    const second = appendRun(first, stamp(HELLO_RUN), HELLO)
    expect(second.map((run) => run.id)).toEqual([1, 2])
  })

  it('ignores a blank line', () => {
    const history = appendRun([], stamp(HELLO_RUN), HELLO)
    expect(appendRun(history, [], { commandLine: '  ', status: 0 })).toBe(history)
  })

  it('remembers at most MAX_TRACE_RUNS runs', () => {
    let history = appendRun([], [], HELLO)
    for (let i = 0; i < MAX_TRACE_RUNS + 5; i++) {
      history = appendRun(history, [], HELLO)
    }
    expect(history).toHaveLength(MAX_TRACE_RUNS)
    expect(history.at(-1)?.id).toBe(MAX_TRACE_RUNS + 6)
  })
})

describe('findCall', () => {
  it('finds a call by id with its run, or undefined', () => {
    const history = appendRun([], stamp(HELLO_RUN), HELLO)
    expect(findCall(history, 2)).toMatchObject({ run: { id: 1 }, call: { name: 'clone' } })
    expect(findCall(history, 99)).toBeUndefined()
    expect(findCall(history, null)).toBeUndefined()
  })
})
