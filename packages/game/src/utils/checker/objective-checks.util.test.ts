import { describe, expect, it } from 'vitest'
import { type EventSketch, shellSession, stamped } from '#test/index'
import type { CheckInput } from '#types/definitions/checker'
import type { ObjectiveCheck, TextMatch } from '#types/definitions/checks'
import { meetsObjectiveCheck } from '#utils/checker/objective-checks.util'

const session: CheckInput = { events: shellSession() }
const ENOENT = 2

describe('meetsObjectiveCheck', () => {
  it('compiles: a program the player built ran', () => {
    expect(meetsObjectiveCheck({ kind: 'compiles' }, session)).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'compiles' }, { events: [] })).toBe(false)
  })

  it('build-fixed: a build failed earlier and the latest one built', () => {
    const fixed = (failedEarlier: boolean, latestErrors: number) =>
      meetsObjectiveCheck({ kind: 'build-fixed' }, { events: [], builds: { failedEarlier, latestErrors } })

    expect(fixed(true, 0)).toBe(true)
    expect(fixed(false, 0)).toBe(false)
    expect(fixed(true, 1)).toBe(false)
    expect(meetsObjectiveCheck({ kind: 'build-fixed' }, session)).toBe(false)
  })

  it('exit-status: judges the player, or the program named', () => {
    expect(meetsObjectiveCheck({ kind: 'exit-status', status: 0 }, session)).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'exit-status', status: 1 }, session)).toBe(false)
    expect(meetsObjectiveCheck({ kind: 'exit-status', status: 0, program: 'ls' }, session)).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'exit-status', status: 0, program: 'sh' }, session)).toBe(false)
  })

  it('wrote: a whole write on the fd, with the text if given', () => {
    expect(meetsObjectiveCheck({ kind: 'wrote', fd: 1 }, session)).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'wrote', fd: 2 }, session)).toBe(false)
    expect(meetsObjectiveCheck({ kind: 'wrote', fd: 1, program: 'ls', text: { equals: 'bin\n' } }, session)).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'wrote', fd: 1, text: { equals: 'bin\n' } }, session)).toBe(false)
  })

  it("terminal: what reached the terminal between the process's execve() and its exit", () => {
    expect(meetsObjectiveCheck({ kind: 'terminal', text: { equals: '$ bin\n' } }, session)).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'terminal', program: 'ls', text: { equals: 'bin\n' } }, session)).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'terminal', text: { endsWith: '$ ' } }, session)).toBe(false)
  })

  it('syscall: a call that returned the value or errno asked for', () => {
    expect(meetsObjectiveCheck({ kind: 'syscall', names: ['openat'] }, session)).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'syscall', names: ['openat'], errno: ENOENT }, session)).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'syscall', names: ['openat'], ret: 3 }, session)).toBe(false)
    expect(meetsObjectiveCheck({ kind: 'syscall', names: ['clone'], ret: 3 }, session)).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'syscall', names: ['read'] }, session)).toBe(false)
  })

  it('no-zombies-after: enough children, each reaped before the parent ended', () => {
    const reapedOne = stamped([
      { type: 'sched_process_exec', pid: 2, oldPid: 2, filename: './ksh' },
      { type: 'sched_process_fork', parentPid: 2, childPid: 3 },
      { type: 'sys_enter', pid: 2, name: 'wait4', args: [3, 0, 0, 0] },
      { type: 'sys_exit', pid: 2, name: 'wait4', ret: 3 },
    ])

    expect(meetsObjectiveCheck({ kind: 'no-zombies-after', commands: 1 }, { events: reapedOne })).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'no-zombies-after', commands: 2 }, { events: reapedOne })).toBe(false)
    expect(meetsObjectiveCheck({ kind: 'no-zombies-after', commands: 1 }, session)).toBe(false)
  })

  it('ran: the program started with arguments that match, and exited with the status asked for', () => {
    const lsLa: CheckInput = { events: lsRun(['ls', '-la', '/etc'], 0) }
    const ran = (check: Omit<Extract<ObjectiveCheck, { kind: 'ran' }>, 'kind'>, input = lsLa) =>
      meetsObjectiveCheck({ kind: 'ran', ...check }, input)

    expect(ran({ program: 'ls' })).toBe(true)
    expect(ran({ program: 'ls', args: { min: 2, match: ['^-[a-z]{2,}$', '^[^-]'] }, status: 0 })).toBe(true)
    expect(ran({ program: 'ls', args: { min: 3 } })).toBe(false)
    expect(ran({ program: 'ls', args: { match: ['^-l$'] } })).toBe(false)
    expect(ran({ program: 'ls', status: 2 })).toBe(false)
    expect(ran({ program: 'cat' })).toBe(false)
  })

  it("ran: never matches arguments the trace didn't record", () => {
    const unrecorded = stamped([{ type: 'sched_process_exec', pid: 3, oldPid: 3, filename: '/bin/ls' }])

    expect(meetsObjectiveCheck({ kind: 'ran', program: 'ls' }, { events: unrecorded })).toBe(true)
    expect(meetsObjectiveCheck({ kind: 'ran', program: 'ls', args: { min: 0 } }, { events: unrecorded })).toBe(false)
  })

  it('read-to-end: the path was opened and read until the kernel answered 0', () => {
    const cat = (reads: readonly number[]) =>
      stamped([
        { type: 'sched_process_exec', pid: 3, oldPid: 3, filename: '/bin/cat' },
        { type: 'sys_enter', pid: 3, name: 'openat', args: [-100, 0, 0, 0], data: '/proc/cmdline' },
        { type: 'sys_exit', pid: 3, name: 'openat', ret: 3 },
        ...reads.flatMap((ret): EventSketch[] => [
          { type: 'sys_enter', pid: 3, name: 'read', args: [3, 0, 4096] },
          { type: 'sys_exit', pid: 3, name: 'read', ret, ...(ret > 0 ? { data: CMDLINE } : {}) },
        ]),
      ])
    const readToEnd = (events: CheckInput['events'], text?: TextMatch) =>
      meetsObjectiveCheck(
        { kind: 'read-to-end', program: 'cat', path: '/proc/cmdline', ...(text ? { text } : {}) },
        { events }
      )

    expect(readToEnd(cat([CMDLINE.length, 0]))).toBe(true)
    expect(readToEnd(cat([CMDLINE.length]))).toBe(false)
    expect(readToEnd(cat([CMDLINE.length, 0]), { contains: 'initcall_debug', notContains: 'quiet' })).toBe(true)
    expect(readToEnd(cat([CMDLINE.length, 0]), { contains: 'quiet' })).toBe(false)
  })
})

const CMDLINE = 'BOOT_IMAGE=/boot/vmlinuz-6.18.0 root=/dev/vda2 ro initcall_debug greeting=hello\n'

/** A shell's child running `/bin/ls` with `argv`, then exiting with `status`. */
function lsRun(argv: readonly string[], status: number) {
  return stamped([
    { type: 'sys_enter', pid: 3, name: 'execve', args: [0, 0, 0], data: '/bin/ls', argv },
    { type: 'sched_process_exec', pid: 3, oldPid: 3, filename: '/bin/ls' },
    { type: 'sys_exit', pid: 3, name: 'execve', ret: 0 },
    { type: 'sys_enter', pid: 3, name: 'exit_group', args: [status] },
    { type: 'sched_process_exit', pid: 3, code: status },
  ])
}
