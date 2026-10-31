import type { CheckInput, SyscallRecord } from '@kernelfall/game/types'
import { callsOf, defineChecker, exitOf, filesOpened, programsNamed, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { EPERM, SIGKILL, SIGSTOP, SIGTERM, STDOUT_FILENO } from '@kernelfall/machine/types'

/** The processes init starts for the level (see level.yaml). */
const INIT_PID = 1
const SLEEP_PID = 401
const YES_PID = 402
/** /proc/<pid>/status's line for a stopped task, as fs/proc/array.c prints it. */
const STOPPED_STATUS = 'State:\tT (stopped)'
const STATUS_PATH = /^\/proc\/(\d+)\/status$/

/** Every kill() of the command, with its target and signal: bash's builtin `kill` makes it itself. */
const killCalls = (events: readonly LabEvent[]): SyscallRecord[] =>
  [...new Set(events.flatMap((event) => ('pid' in event ? [event.pid] : [])))].flatMap((pid) =>
    callsOf(events, pid, ['kill'])
  )

const sent = (call: SyscallRecord, target: Pid, sig: number) =>
  call.enter.args[0] === target && call.enter.args[1] === sig && call.exit?.ret === 0

/** A `ps` line for `pid` whose STAT column starts with T. */
function psShowsStopped(stdout: string, pid: Pid): boolean {
  return stdout.split('\n').some((line) => {
    const words = line.trim().split(/\s+/)
    return words[0] === String(pid) && words.some((word) => /^T[a-zA-Z+<]*$/.test(word))
  })
}

/** `cat` read /proc/<pid>/status of a process other than itself, and printed it. */
const readOthersStatus = (events: readonly LabEvent[], pid: Pid): boolean =>
  filesOpened(events, pid).some(({ path, ret }) => {
    const target = STATUS_PATH.exec(path)?.[1]
    return target !== undefined && Number(target) !== pid && ret !== undefined && ret >= 0
  })

const killedBy = (events: readonly LabEvent[], pid: Pid, signals: readonly number[]): boolean => {
  const signal = exitOf(events, pid)?.signal
  return signal !== undefined && signals.includes(signal)
}

// init started these outside the player's shell, so their own events aren't traced. Neither ends
// by itself during the level (sleep 600, yes), so a `ps` that no longer lists one, or lists it as
// a zombie (Z: exited, not yet reaped by init), shows it ended.
const psShowsEnded = (events: readonly LabEvent[], pid: Pid): boolean =>
  programsNamed(events, 'ps').some((ps) => {
    const lines = writtenTo(events, ps, STDOUT_FILENO).trim().split('\n')
    const row = lines.find((line) => line.trim().split(/\s+/)[0] === String(pid))
    return (
      lines.length > 1 &&
      (row === undefined ||
        row
          .trim()
          .split(/\s+/)
          .some((word) => /^Z/.test(word)))
    )
  })

export const checker = defineChecker({
  // Every command is judged: the Survey uses the Machine's own programs, never the player's.
  applies: ({ events }: CheckInput) => events.length > 0,

  check({ events }) {
    const kills = killCalls(events)
    const cats = programsNamed(events, 'cat')
    const judged: Readonly<Record<string, boolean>> = {
      'paused-yes': kills.some((call) => sent(call, YES_PID, SIGSTOP)),
      'saw-stopped':
        programsNamed(events, 'ps').some((pid) => psShowsStopped(writtenTo(events, pid, STDOUT_FILENO), YES_PID)) ||
        cats.some(
          (pid) =>
            filesOpened(events, pid).some(({ path }) => path === `/proc/${YES_PID}/status`) &&
            writtenTo(events, pid, STDOUT_FILENO).includes(STOPPED_STATUS)
        ),
      'read-status': cats.some((pid) => readOthersStatus(events, pid)),
      'yes-ended': killedBy(events, YES_PID, [SIGTERM, SIGKILL]) || psShowsEnded(events, YES_PID),
      'sleep-ended': killedBy(events, SLEEP_PID, [SIGTERM]) || psShowsEnded(events, SLEEP_PID),
      'kill-init-denied': kills.some((call) => call.enter.args[0] === INIT_PID && call.exit?.ret === -EPERM),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
