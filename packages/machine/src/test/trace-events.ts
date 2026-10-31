import { utf8Encode } from '@kernelfall/core/utils'
import type { LabEvent, LabEventInit } from '#events/types'

/** Stamps events in order from `firstSeq`, as the event stream does. */
export function stamp(inits: readonly LabEventInit[], firstSeq = 0): LabEvent[] {
  return inits.map((init, i) => ({ ...init, seq: firstSeq + i, time: 0 }) as LabEvent)
}

const HELLO = utf8Encode('hi\n')

/** `./hello` as pid 7: writes "hi\n", forks pid 8, which exits 3, then exits 0. pid 1 reaps it. */
export const HELLO_RUN: readonly LabEventInit[] = [
  { type: 'sys_enter', pid: 7, nr: 1, name: 'write', args: [1, 0x1000, HELLO.length], data: HELLO },
  { type: 'sys_exit', pid: 7, nr: 1, name: 'write', ret: HELLO.length },
  { type: 'sys_enter', pid: 7, nr: 56, name: 'clone', args: [0x11, 0] },
  { type: 'sched_process_fork', parentPid: 7, childPid: 8 },
  { type: 'sys_exit', pid: 7, nr: 56, name: 'clone', ret: 8 },
  { type: 'sys_enter', pid: 8, nr: 231, name: 'exit_group', args: [3] },
  { type: 'sched_process_exit', pid: 8, code: 3 },
  { type: 'sys_enter', pid: 1, nr: 61, name: 'wait4', args: [-1, 0, 0, 0] },
  { type: 'sys_enter', pid: 7, nr: 231, name: 'exit_group', args: [0] },
  { type: 'sched_process_exit', pid: 7, code: 0 },
]
