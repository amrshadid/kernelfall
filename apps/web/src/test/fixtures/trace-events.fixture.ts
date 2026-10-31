import type { RunEvent } from '@kernelfall/machine/hooks'
import type { TraceRun } from '@kernelfall/machine/types'
import { buildRun } from '@kernelfall/machine/utils'

/** A trace event before it is stamped with `seq` and `time`. */
export type EventInit = RunEvent extends infer E ? (E extends RunEvent ? Omit<E, 'seq' | 'time'> : never) : never

export const bytes = (text: string): Uint8Array => new TextEncoder().encode(text)

/** Stamps events in order, as the machine does. */
export const stamp = (inits: readonly EventInit[]): RunEvent[] =>
  inits.map((init, seq) => ({ ...init, seq, time: 0 }) as RunEvent)

/** The trace X-ray reads for these events, as the machine's trace store builds it. */
export const runOf = (events: readonly RunEvent[], commandLine: string): TraceRun =>
  buildRun(1, [...events], { commandLine, status: 0 })

// `echo hello` as a shell builtin: PID 2 writes and exits, init's part left in.
export const ECHO: RunEvent[] = stamp([
  { type: 'sys_enter', pid: 2, nr: 1, name: 'write', args: [1, 0x10000, 6], data: bytes('hello\n') },
  { type: 'console_write', bytes: bytes('hello\n') },
  { type: 'sys_exit', pid: 2, nr: 1, name: 'write', ret: 6 },
  { type: 'sys_enter', pid: 2, nr: 231, name: 'exit_group', args: [0] },
  { type: 'sched_process_exit', pid: 2, code: 0 },
  { type: 'signal_generate', pid: 1, sig: 17, result: 'delivered' },
  { type: 'sched_process_free', pid: 2 },
])

// A shell (PID 2) runs `echo hi`: fork as clone, execve, the child's write and exit, wait4.
export const FORK_EXEC_WAIT: EventInit[] = [
  { type: 'sys_enter', pid: 2, nr: 56, name: 'clone', args: [17, 0, 0, 0, 0] },
  { type: 'sched_process_fork', parentPid: 2, childPid: 3 },
  { type: 'sys_exit', pid: 2, nr: 56, name: 'clone', ret: 3 },
  { type: 'sys_enter', pid: 2, nr: 61, name: 'wait4', args: [3, 0x4000, 0, 0] },
  { type: 'sys_exit', pid: 3, nr: 56, name: 'clone', ret: 0 },
  { type: 'sys_enter', pid: 3, nr: 59, name: 'execve', args: [0x1000, 0x2000, 0x3000], data: bytes('/bin/echo') },
  { type: 'sched_process_exec', pid: 3, oldPid: 3, filename: '/bin/echo' },
  { type: 'sys_exit', pid: 3, nr: 59, name: 'execve', ret: 0 },
  { type: 'sys_enter', pid: 3, nr: 1, name: 'write', args: [1, 0x5000, 3], data: bytes('hi\n') },
  { type: 'console_write', bytes: bytes('hi\n') },
  { type: 'sys_exit', pid: 3, nr: 1, name: 'write', ret: 3 },
  { type: 'sys_enter', pid: 3, nr: 231, name: 'exit_group', args: [0] },
  { type: 'sched_process_exit', pid: 3, code: 0 },
  { type: 'signal_generate', pid: 2, sig: 17, result: 'delivered' },
  { type: 'sched_process_free', pid: 3 },
  { type: 'sys_exit', pid: 2, nr: 61, name: 'wait4', ret: 3 },
]
