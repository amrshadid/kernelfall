import type { LabEvent, LabEventInit } from '@kernelfall/machine/events'
import { SYSCALL_NUMBERS } from '@kernelfall/machine/types'

const ascii = (text: string): Uint8Array => Uint8Array.from(text, (c) => c.charCodeAt(0))

/**
 * A hand-written event: text in `bytes` or `data` is written as ASCII, and a
 * syscall's `nr` comes from its name, as the VM's i386 kernel numbers it. An
 * execve()'s `sys_enter` may carry its `argv`, decoded as strace shows it.
 */
export type EventSketch = LabEventInit extends infer E
  ? E extends { readonly type: 'console_write' }
    ? { readonly type: 'console_write'; readonly bytes: string }
    : E extends { readonly data?: Uint8Array }
      ? Omit<E, 'data' | 'nr'> & { readonly data?: string; readonly argv?: readonly string[] }
      : E
  : never

/** Throws on a name the kernel doesn't have, so a typo in a test fails loudly. */
export function syscallNr(name: string): number {
  const nr = SYSCALL_NUMBERS[name]
  if (nr === undefined) {
    throw new Error(`no syscall named ${name}`)
  }
  return nr
}

/** Numbers events in order (`seq` 0, 1, 2…), as the trace stamps them, turning their text into bytes. */
export function stamped(sketches: readonly EventSketch[]): LabEvent[] {
  return sketches.map((sketch, seq) => {
    const time = 0
    if (sketch.type === 'console_write') {
      return { ...sketch, bytes: ascii(sketch.bytes), seq, time }
    }
    const numbered = 'name' in sketch ? { ...sketch, nr: syscallNr(sketch.name) } : sketch
    if ('data' in numbered && typeof numbered.data === 'string') {
      return { ...numbered, data: ascii(numbered.data), seq, time } as LabEvent
    }
    return { ...numbered, seq, time } as LabEvent
  })
}

const ENOENT = 2

/**
 * A session of the player's `./ksh` (pid 2), seq by seq:
 * it prints a prompt, opens `notes.txt` (ENOENT), forks pid 3, which runs
 * `/bin/ls` and prints `bin\n`, reaps it, forks pid 4, which runs `/bin/sh`
 * and is never reaped, and exits with status 0.
 */
export const shellSession = (): LabEvent[] =>
  stamped([
    { type: 'sched_process_exec', pid: 2, oldPid: 2, filename: './ksh' }, // 0
    { type: 'sys_enter', pid: 2, name: 'write', args: [1, 0, 2], data: '$ ' }, // 1
    { type: 'console_write', bytes: '$ ' }, // 2
    { type: 'sys_exit', pid: 2, name: 'write', ret: 2 }, // 3
    { type: 'sys_enter', pid: 2, name: 'openat', args: [-100, 0, 0o100, 0], data: 'notes.txt' }, // 4
    { type: 'sys_exit', pid: 2, name: 'openat', ret: -ENOENT }, // 5
    { type: 'sys_enter', pid: 2, name: 'clone', args: [17] }, // 6
    { type: 'sched_process_fork', parentPid: 2, childPid: 3 }, // 7
    { type: 'sys_exit', pid: 2, name: 'clone', ret: 3 }, // 8
    { type: 'sys_enter', pid: 2, name: 'wait4', args: [3, 0, 0, 0] }, // 9
    { type: 'sys_enter', pid: 3, name: 'execve', args: [0, 0, 0], data: '/bin/ls' }, // 10
    { type: 'sched_process_exec', pid: 3, oldPid: 3, filename: '/bin/ls' }, // 11
    { type: 'sys_enter', pid: 3, name: 'write', args: [1, 0, 4], data: 'bin\n' }, // 12
    { type: 'console_write', bytes: 'bin\n' }, // 13
    { type: 'sys_exit', pid: 3, name: 'write', ret: 4 }, // 14
    { type: 'sched_process_exit', pid: 3, code: 0 }, // 15
    { type: 'sys_exit', pid: 2, name: 'wait4', ret: 3 }, // 16
    { type: 'sys_enter', pid: 2, name: 'clone', args: [17] }, // 17
    { type: 'sched_process_fork', parentPid: 2, childPid: 4 }, // 18
    { type: 'sys_exit', pid: 2, name: 'clone', ret: 4 }, // 19
    { type: 'sched_process_exec', pid: 4, oldPid: 4, filename: '/bin/sh' }, // 20
    { type: 'sched_process_exit', pid: 2, code: 0 }, // 21
  ])
