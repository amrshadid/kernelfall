import type { CpuLane, CpuLanesView, CpuSlice, LaneTaskState } from '@features/xray/types'
import { baseName, programOf } from '@features/xray/utils/calls'
import type { RunEvent } from '@kernelfall/machine/hooks'
import { CONTINUE_SIGNAL, SLEEPING_CALLS, STOP_SIGNALS } from './cpu-lanes.constants'

/** The CPU an event ran on; an event that doesn't say ran on CPU 0. */
export function cpuOf(event: RunEvent): number {
  return 'cpu' in event && typeof event.cpu === 'number' ? event.cpu : 0
}

/** The task an event belongs to: a fork is the parent's work. */
function pidOf(event: RunEvent): number | null {
  if ('pid' in event) return event.pid
  if (event.type === 'sched_process_fork') return event.parentPid
  return null
}

interface TaskTrack {
  program: string | null
  cpu: number
  state: LaneTaskState
  /** The state to go back to when SIGCONT continues it. */
  beforeStop: LaneTaskState
  freed: boolean
}

/**
 * One lane per CPU: who ran there, in order, and each CPU's run queue when the
 * run ends. A task stays on the CPU its first traced event ran on.
 */
// SIMPLIFIED: the lanes show the traced events in order, not EEVDF's time slices,
// and no task moves between CPUs (Linux balances the load).
export function cpuLanesOf(
  commandLine: string,
  rootPid: number | null,
  events: readonly RunEvent[],
  cpus: number
): CpuLanesView {
  const tasks = new Map<number, TaskTrack>()
  // A child runs its parent's program until it execs; it is placed by its own first event.
  // Tasks started before the run (init's background programs) are known only by their pid.
  const inherited = new Map<number, string | null>(rootPid === null ? [] : [[rootPid, programOf(commandLine)]])
  const slices: { cpu: number; slice: { pid: number; program: string | null; calls: string[] } }[] = []

  const track = (pid: number, cpu: number): TaskTrack => {
    const known = tasks.get(pid)
    if (known) return known
    const program = inherited.get(pid) ?? null
    const task: TaskTrack = { program, cpu, state: 'R', beforeStop: 'R', freed: false }
    tasks.set(pid, task)
    return task
  }
  const sliceFor = (pid: number, cpu: number) => {
    const last = slices.findLast((entry) => entry.cpu === cpu)
    if (last && last.slice.pid === pid) return last.slice
    const slice = { pid, program: tasks.get(pid)?.program ?? null, calls: [] as string[] }
    slices.push({ cpu, slice })
    return slice
  }

  for (const event of events) {
    const pid = pidOf(event)
    if (pid === null) continue
    const cpu = Math.min(cpuOf(event), cpus - 1)
    const task = track(pid, cpu)
    switch (event.type) {
      case 'sys_enter':
        sliceFor(pid, task.cpu).calls.push(event.name)
        task.state = SLEEPING_CALLS.has(event.name) ? 'S' : 'R'
        break
      case 'sys_exit':
        sliceFor(pid, task.cpu)
        if (task.state === 'S') task.state = 'R'
        break
      case 'sched_process_fork':
        inherited.set(event.childPid, task.program)
        break
      case 'sched_process_exec':
        task.program = baseName(event.filename)
        sliceFor(pid, task.cpu).program = task.program
        break
      case 'signal_deliver':
        if (STOP_SIGNALS.has(event.sig)) {
          task.beforeStop = task.state
          task.state = 'T'
        }
        break
      case 'signal_generate':
        if (event.sig === CONTINUE_SIGNAL && task.state === 'T') task.state = task.beforeStop
        break
      case 'sched_process_exit':
        task.state = 'Z'
        break
      case 'sched_process_free':
        task.freed = true
        break
      default:
        break
    }
  }

  const lanes: CpuLane[] = Array.from({ length: cpus }, (_, cpu) => ({
    cpu,
    slices: slices.filter((entry) => entry.cpu === cpu).map((entry): CpuSlice => entry.slice),
    queue: [...tasks]
      .filter(([, task]) => task.cpu === cpu && !task.freed)
      .map(([pid, task]) => ({ pid, program: task.program, state: task.state })),
  }))
  return { commandLine, lanes }
}
