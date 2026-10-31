import type { LabEvent } from '#events/types'
import type { FinishedCommand, TraceCall, TraceRun } from '#types/definitions/trace'
import { MAX_TRACE_RUNS } from '#types/definitions/trace'

const PENDING = { kind: 'pending' } as const

/**
 * Pairs each `sys_enter` with what ended it, in the order the calls were made.
 * Like `strace -f`, it follows the command's process and the children it
 * forks, and leaves out other tasks (init reaping the command, for example).
 */
export function buildRun(id: number, events: readonly LabEvent[], command: FinishedCommand): TraceRun {
  const calls: TraceCall[] = []
  const traced = new Set<number>()
  // The shell runs the command: it forks it, or makes a builtin's calls itself. A command can
  // open with someone else's event (init reaping the last command's child), never the root.
  const firstFork = events.find((event) => event.type === 'sched_process_fork')
  const firstCall = events.find((event) => event.type === 'sys_enter')
  let pid: number | null =
    firstFork?.type === 'sched_process_fork'
      ? firstFork.parentPid
      : firstCall && 'pid' in firstCall
        ? firstCall.pid
        : null
  if (pid !== null) {
    traced.add(pid)
  }
  let exitCode: number | null = null
  const follows = (eventPid: number): boolean => {
    if (pid === null) {
      pid = eventPid
      traced.add(eventPid)
    }
    return traced.has(eventPid)
  }

  for (const event of events) {
    if ('pid' in event && !follows(event.pid)) {
      continue
    }
    switch (event.type) {
      case 'sys_enter': {
        const { seq, nr, name, args, data } = event
        calls.push({
          id: seq,
          pid: event.pid,
          nr,
          name,
          args,
          result: PENDING,
          ...(data && { data }),
        })
        break
      }
      case 'sys_exit':
        settleLast(calls, event.pid, { kind: 'returned', ret: event.ret }, event.data)
        break
      case 'sched_process_fork':
        if (traced.has(event.parentPid)) {
          traced.add(event.childPid)
        }
        break
      case 'sched_process_exit':
        if (event.pid === pid) {
          exitCode = event.code
        }
        settleLast(calls, event.pid, { kind: 'exited' })
        break
      default:
        break
    }
  }
  return { id, commandLine: command.commandLine, status: command.status, pid, calls, exitCode }
}

/** Marks the task's latest unfinished call as finished; a buffer it filled (read) replaces its data. */
function settleLast(calls: TraceCall[], pid: number, result: TraceCall['result'], data?: Uint8Array): void {
  for (let i = calls.length - 1; i >= 0; i--) {
    const call = calls[i]
    if (call && call.pid === pid && call.result.kind === 'pending') {
      calls[i] = { ...call, result, ...(data && { data }) }
      return
    }
  }
}

/** Adds a command's events to the history. Blank lines (Enter, Ctrl-C) are not runs. */
export function appendRun(
  history: readonly TraceRun[],
  events: readonly LabEvent[],
  command: FinishedCommand
): readonly TraceRun[] {
  if (command.commandLine.trim() === '') {
    return history
  }
  const id = (history.at(-1)?.id ?? 0) + 1
  return [...history, buildRun(id, events, command)].slice(-MAX_TRACE_RUNS)
}

/** Finds a call anywhere in the history, with the run it belongs to. */
export function findCall(
  history: readonly TraceRun[],
  id: number | null
): { readonly run: TraceRun; readonly call: TraceCall } | undefined {
  for (const run of history) {
    const call = run.calls.find((c) => c.id === id)
    if (call) {
      return { run, call }
    }
  }
  return undefined
}
