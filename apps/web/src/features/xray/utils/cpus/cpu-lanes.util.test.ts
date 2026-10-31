import type { RunEvent } from '@kernelfall/machine/hooks'
import { SIGCONT, SIGSTOP } from '@kernelfall/machine/types'
import { describe, expect, it } from 'vitest'
import { bytes, type EventInit, stamp } from '@/test/fixtures/trace-events.fixture'
import { cpuLanesOf, cpuOf } from './cpu-lanes.util'

/** Stamps the events, each on the CPU given beside it, as the trace reports them. */
function onCpus(entries: readonly (readonly [number, EventInit])[]): RunEvent[] {
  const stamped = stamp(entries.map(([, init]) => init))
  return stamped.map((event, i) => Object.assign({ cpu: entries[i]?.[0] ?? 0 }, event))
}

// S.3: init's `sleep 600` (401) waits on CPU 0 and `yes` (402) writes to /dev/null on CPU 1,
// while the player's `kill -STOP 402` (33, forked by the shell) runs on CPU 0.
const STOP_YES = onCpus([
  [1, { type: 'sys_enter', pid: 402, nr: 1, name: 'write', args: [1, 0x1000, 8192], data: bytes('y\n') }],
  [1, { type: 'sys_exit', pid: 402, nr: 1, name: 'write', ret: 8192 }],
  [0, { type: 'sys_enter', pid: 401, nr: 230, name: 'clock_nanosleep', args: [0, 0, 0x2000, 0] }],
  [0, { type: 'sys_enter', pid: 33, nr: 59, name: 'execve', args: [0x1000, 0x2000, 0x3000], data: bytes('/bin/kill') }],
  [0, { type: 'sched_process_exec', pid: 33, oldPid: 33, filename: '/bin/kill' }],
  [0, { type: 'sys_exit', pid: 33, nr: 59, name: 'execve', ret: 0 }],
  [0, { type: 'sys_enter', pid: 33, nr: 62, name: 'kill', args: [402, SIGSTOP] }],
  [0, { type: 'signal_generate', pid: 402, sig: SIGSTOP, result: 'delivered' }],
  [1, { type: 'signal_deliver', pid: 402, sig: SIGSTOP }],
  [0, { type: 'sys_exit', pid: 33, nr: 62, name: 'kill', ret: 0 }],
  [0, { type: 'sys_enter', pid: 33, nr: 231, name: 'exit_group', args: [0] }],
  [0, { type: 'sched_process_exit', pid: 33, code: 0 }],
  [0, { type: 'sched_process_free', pid: 33 }],
])

describe('cpuOf', () => {
  it('reads the CPU an event ran on, else CPU 0', () => {
    expect(cpuOf(STOP_YES[0] as RunEvent)).toBe(1)
    expect(cpuOf(stamp([{ type: 'sched_process_free', pid: 2 }])[0] as RunEvent)).toBe(0)
  })
})

describe('cpuLanesOf', () => {
  const view = cpuLanesOf('kill -STOP 402', 33, STOP_YES, 2)
  const said = (slice: { pid: number; program: string | null; calls: readonly string[] }) =>
    `${slice.pid} ${slice.program ?? '?'}: ${slice.calls.join(',')}`

  it('draws one lane per CPU with who ran there, in order', () => {
    expect(view.lanes.map((lane) => lane.slices.map(said))).toEqual([
      ['401 ?: clock_nanosleep', '33 kill: execve,kill,exit_group'],
      ['402 ?: write'],
    ])
  })

  it("keeps each CPU's run queue: sleeping, stopped, and freed tasks gone", () => {
    expect(view.lanes[0]?.queue).toEqual([{ pid: 401, program: null, state: 'S' }])
    expect(view.lanes[1]?.queue).toEqual([{ pid: 402, program: null, state: 'T' }])
  })

  it('continues a stopped task on SIGCONT', () => {
    const resumed = [...STOP_YES, ...stamp([{ type: 'signal_generate', pid: 402, sig: SIGCONT, result: 'delivered' }])]
    expect(cpuLanesOf('kill -CONT 402', 33, resumed, 2).lanes[1]?.queue[0]?.state).toBe('R')
  })

  it('puts everything on CPU 0 while the trace names no CPU', () => {
    const plain = stamp([{ type: 'sys_enter', pid: 33, nr: 39, name: 'getpid', args: [] }])
    const lanes = cpuLanesOf('./whoami', 33, plain, 2).lanes
    expect(lanes.map((lane) => lane.slices.length)).toEqual([1, 0])
  })
})
