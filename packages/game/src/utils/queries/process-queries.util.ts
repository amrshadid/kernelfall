import type { LabEvent, LabEventOf } from '@kernelfall/machine/events'
import type { Pid } from '@kernelfall/machine/types'
import { STDERR_FILENO, STDOUT_FILENO } from '@kernelfall/machine/types'
import type { ProgramScope } from '#types/definitions/checks'
import type { ChildRun, ForkedChild, ProcessExit } from '#types/definitions/queries'
import { asText, basename, eventsOf } from '#utils/queries/event-queries.util'
import { writtenTo } from '#utils/queries/output-queries.util'
import { callsOf, failedCalls } from '#utils/queries/syscall-queries.util'

/** Programs the Machine ships, gcc's own helpers included; anything else that runs was built by the player. */
const SYSTEM_DIRS = ['/bin/', '/sbin/', '/usr/bin/', '/usr/sbin/', '/usr/libexec/', '/usr/lib/', '/lib/']

/**
 * The player's programs the command started: tasks that ran a program from
 * outside /bin, unless one of the player's programs forked them. A child the
 * player's program forks is its work, judged through its parent; a child of the
 * shell is the command itself.
 */
export function playerPrograms(events: readonly LabEvent[]): Pid[] {
  const parentOf = new Map(eventsOf(events, 'sched_process_fork').map((event) => [event.childPid, event.parentPid]))
  const own = eventsOf(events, 'sched_process_exec').filter(
    (event) => !SYSTEM_DIRS.some((dir) => event.filename.startsWith(dir))
  )
  const ranOwn = new Set(own.map((event) => event.pid))
  const forkedByOwn = (pid: Pid) => {
    const parent = parentOf.get(pid)
    return parent !== undefined && ranOwn.has(parent)
  }
  return [...ranOwn].filter((pid) => !forkedByOwn(pid))
}

/** Every task that ran a program called `name` (`ls` matches `/bin/ls` and `./ls`), in order. */
export function programsNamed(events: readonly LabEvent[], name: string): Pid[] {
  const pids = eventsOf(events, 'sched_process_exec')
    .filter((event) => basename(event.filename) === name)
    .map((event) => event.pid)
  return [...new Set(pids)]
}

/** The processes a check judges: the player's programs, or with `program`, every task that ran it. */
export const judgedProcesses = (events: readonly LabEvent[], scope: ProgramScope = {}): Pid[] =>
  scope.program === undefined ? playerPrograms(events) : programsNamed(events, scope.program)

/** The programs `pid` became through execve(), in order. */
export const execsOf = (events: readonly LabEvent[], pid: Pid): LabEventOf<'sched_process_exec'>[] =>
  eventsOf(events, 'sched_process_exec').filter((event) => event.pid === pid)

/** The argv an execve() call passed, when its trace decoded it as strace does; undefined otherwise. */
export function argvOfCall(enter: LabEventOf<'sys_enter'>): readonly string[] | undefined {
  // Read by shape, not by type: older traces (and recorded runs) don't carry it.
  if (!('argv' in enter)) {
    return undefined
  }
  const { argv } = enter
  return Array.isArray(argv) && argv.every((arg) => typeof arg === 'string') ? argv : undefined
}

/**
 * The arguments `pid` was started with, its name first: through the execve()
 * that made it `program`, or with no `program`, its first one that worked.
 * Undefined when no such execve() is in the events, or its trace has no argv.
 */
export function argvOf(events: readonly LabEvent[], pid: Pid, program?: string): readonly string[] | undefined {
  const call = callsOf(events, pid, ['execve']).find(
    ({ enter, exit }) =>
      // An execve() that worked returns 0, or never returns within the events.
      (exit === undefined || exit.ret === 0) && (program === undefined || basename(asText(enter.data)) === program)
  )
  return call ? argvOfCall(call.enter) : undefined
}

/** How `pid` ended, or undefined if it was still running when the events end. */
export function exitOf(events: readonly LabEvent[], pid: Pid): ProcessExit | undefined {
  const exit = eventsOf(events, 'sched_process_exit').find((event) => event.pid === pid)
  return exit ? { seq: exit.seq, code: exit.code, signal: exit.signal } : undefined
}

/** Ended through exit() or a return from main with `status`, not killed by a signal. */
export const exitedWith = (exit: ProcessExit | undefined, status: number): boolean =>
  exit !== undefined && exit.signal === undefined && exit.code === status

/** Children of `parent` its wait4() collected, with the return that reaped each. */
export function reapedBy(events: readonly LabEvent[], parent: Pid): ReadonlyMap<Pid, LabEventOf<'sys_exit'>> {
  const reaped = new Map<Pid, LabEventOf<'sys_exit'>>()
  for (const call of callsOf(events, parent, ['wait4'])) {
    // wait4() returns the reaped child's pid; 0 (WNOHANG, none ready) and -errno reap nothing.
    if (call.exit && call.exit.ret > 0) {
      reaped.set(call.exit.ret, call.exit)
    }
  }
  return reaped
}

/** Every child `parent` forked, oldest first, with when (and whether) the parent reaped it. */
export function forkedChildren(events: readonly LabEvent[], parent: Pid): ForkedChild[] {
  const reaped = reapedBy(events, parent)
  return eventsOf(events, 'sched_process_fork')
    .filter((event) => event.parentPid === parent)
    .map((event) => ({ pid: event.childPid, forkSeq: event.seq, reapedSeq: reaped.get(event.childPid)?.seq ?? null }))
}

/** Every child `parent` forked, oldest first, with what each ran, printed and how it ended. */
export function childrenOf(events: readonly LabEvent[], parent: Pid): ChildRun[] {
  return forkedChildren(events, parent).map((child) => ({
    ...child,
    programs: execsOf(events, child.pid).map((event) => event.filename),
    execErrors: failedCalls(events, child.pid, ['execve']).map((failed) => failed.errno),
    stdout: writtenTo(events, child.pid, STDOUT_FILENO),
    stderr: writtenTo(events, child.pid, STDERR_FILENO),
    exit: exitOf(events, child.pid),
  }))
}

/** The child became a program called `name` (`ls` matches `/bin/ls` and `./ls`). */
export const ranProgram = (child: ChildRun, name: string): boolean =>
  child.programs.some((path) => basename(path) === name)
