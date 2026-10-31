import type { LabEvent, LabEventInit } from '#events/types'
import type { SignalGenerateResult } from '#types/definitions/signal'
import { VM_TRACE_AS_END, VM_TRACE_AS_START, VM_TRACE_END, VM_TRACE_START } from '#types/definitions/vm'
import { TRACE_PROBES, type TracedCommand, type TraceRecord } from '#types/definitions/vm-trace'
import {
  argvOf,
  chunkBytes,
  fieldNumber,
  joinChunks,
  joinIovecs,
  parseProbeName,
  parseTraceLine,
  pathData,
  syscallNumber,
} from '#utils/vm-trace/index'

export interface VmTraceCallbacks {
  /** New events for the running command; called once per pushed chunk that added any. */
  onProgress(command: TracedCommand): void
  onFinished(command: TracedCommand): void
}

const SIGSEGV = 11
const EXIT_CODE_MASK = 0xff
const EXIT_SYSCALLS = new Set(['exit', 'exit_group'])
const WRITE_SYSCALLS = new Set(['write', 'writev'])
// trace_signal_generate's `res` (include/trace/events/signal.h: TRACE_SIGNAL_*).
const SIGNAL_RESULTS: Readonly<Record<string, SignalGenerateResult>> = { '1': 'ignored', '2': 'already_pending' }
// `history 1` prints the entry's number first.
const HISTORY_NUMBER = /^\s*\d+\s+/
/** Between commands the shell edits the line (and completes it): kept for the next command, up to this. */
const IDLE_MAX_EVENTS = 5000
/**
 * The shell's own housekeeping between commands, by tracepoint name: waiting for keys and reading
 * them, echo and prompt, terminal modes, and the markers' ${ …; } funsubs, which bash runs on a
 * memfd it dup2s in and out.
 */
/** What PS0's funsub does after writing the start marker, restoring the shell's stdout. */
const FUNSUB_CLEANUP = new Set(['dup2', 'fcntl64', 'close', 'rt_sigprocmask', 'llseek', 'read'])
const SHELL_HOUSEKEEPING = new Set([
  'read',
  'write',
  'writev',
  'ioctl',
  'rt_sigprocmask',
  'rt_sigaction',
  'pselect6',
  'pselect6_time32',
  'memfd_create',
  'prlimit64',
  'dup2',
  'fcntl64',
  'close',
  'llseek',
  'mmap_pgoff',
  'munmap',
])

/** A buffer's chunks as their probes printed them, until the call's sys_exit says how much it moved. */
interface Capture {
  ret: number
  /** writev's iovec count. */
  count: number
  iovecs: Map<number, { length: number; chunks: Map<number, Uint8Array> }>
}

interface Window {
  /** Null between commands: what happens then waits for the next command. */
  commandLine: string | null
  /** Who writes this window's markers: the player's shell, or the host's run-as helper. */
  markerPid: number | null
  events: LabEvent[]
  /** Where each task's latest syscall entry is, so a probe's data can be added to it. */
  lastEnter: Map<number, number>
  exitCodes: Map<number, number>
  lastSignal: Map<number, number>
  captures: Map<number, Capture>
  /** Each task's latest terminal write, which a later chunk of the same write extends. */
  lastTty: Map<number, number>
  /** Faults are kept only when a SIGSEGV follows: the model's page_fault_user is a bad access. */
  lastFault: Map<number, LabEventInit>
  /** The marker's own write returns right after kf-start; it isn't the command's. */
  skipShellExit: boolean
  dirty: boolean
}

const newWindow = (commandLine: string | null, events: LabEvent[] = [], markerPid: number | null = null): Window => ({
  commandLine,
  markerPid,
  events,
  lastEnter: new Map(),
  exitCodes: new Map(),
  lastSignal: new Map(),
  captures: new Map(),
  lastTty: new Map(),
  lastFault: new Map(),
  skipShellExit: commandLine !== null,
  dirty: false,
})

/** Drops the shell's write of a marker: its last write entry in `events`. */
function dropMarkerWrite(events: LabEvent[], shellPid: number | null): void {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i]
    if (event?.type === 'sys_enter' && event.pid === shellPid && WRITE_SYSCALLS.has(event.name)) {
      events.splice(i)
      return
    }
  }
}

/**
 * Turns the guest's trace_pipe into commands: bash brackets each one with markers, and only the
 * shell and its descendants are traced. What the shell does between two commands (editing the
 * line, completing a name with Tab) belongs to the command it leads to.
 */
export function createVmTrace(callbacks: VmTraceCallbacks) {
  let partial = ''
  /** The player's shell, whose line editing between commands is left out. */
  let shellPid: number | null = null
  let window = newWindow(null)
  /** The player's time between commands, set aside while a run-as command has the stream. */
  let stashed: Window | null = null

  // Of the shell's work between commands, only what isn't line editing (Tab's opendir, its forks).
  const editsLine = (init: LabEventInit, pid: number | null) =>
    'pid' in init &&
    init.pid === pid &&
    (init.type === 'console_write' ||
      ((init.type === 'sys_enter' || init.type === 'sys_exit') && SHELL_HOUSEKEEPING.has(init.name)))
  const isLineEditing = (init: LabEventInit) => window.commandLine === null && editsLine(init, shellPid)

  // PS0's funsub writes the start marker, then restores the shell's stdout: that cleanup leads
  // every command, up to the shell's first call of its own.
  let trimming = false
  let trimmedEnter: string | null = null
  const isFunsubCleanup = (init: LabEventInit): boolean => {
    if (!trimming || !('pid' in init) || init.pid !== shellPid) {
      return false
    }
    if (init.type === 'sys_exit' && init.name === trimmedEnter) {
      trimmedEnter = null
      return true
    }
    // A builtin's own read of the terminal (`read x`) is the command's.
    if (init.type === 'sys_enter' && FUNSUB_CLEANUP.has(init.name) && !(init.name === 'read' && init.args[0] === 0)) {
      trimmedEnter = init.name
      return true
    }
    return false
  }

  /** False when the event is left out. */
  const append = (init: LabEventInit, time: number): boolean => {
    if (isLineEditing(init) || isFunsubCleanup(init)) {
      return false
    }
    if (window.commandLine !== null) {
      trimming = false
    }
    if (window.commandLine === null && window.events.length >= IDLE_MAX_EVENTS) {
      window = newWindow(null)
    }
    window.events.push({ ...init, seq: window.events.length, time } as LabEvent)
    window.dirty = true
    return true
  }

  const replace = (index: number, event: LabEvent) => {
    window.events[index] = event
    window.dirty = true
  }

  const finish = (text: string, marker: string) => {
    const done = window
    if (done.commandLine === null) {
      // A prompt with no command before it: the shell's start-up or an empty line, no one's work.
      window = newWindow(null)
      return
    }
    dropMarkerWrite(done.events, done.markerPid)
    window = stashed ?? newWindow(null)
    stashed = null
    const status = Number.parseInt(text.slice(marker.length), 10) || 0
    callbacks.onFinished({ commandLine: done.commandLine, status, events: done.events })
  }

  const onMarker = (record: TraceRecord & { kind: 'marker' }) => {
    const { text, pid } = record
    if (text.startsWith(VM_TRACE_AS_START)) {
      // Another user's command: the player's time between commands waits for the player's next one.
      dropMarkerWrite(window.events, pid)
      stashed = window.commandLine === null ? window : null
      window = newWindow(text.slice(VM_TRACE_AS_START.length).trim(), [], pid)
    } else if (text.startsWith(VM_TRACE_AS_END)) {
      finish(text, VM_TRACE_AS_END)
    } else if (text.startsWith(VM_TRACE_START)) {
      shellPid = pid
      const idle = window.events
      dropMarkerWrite(idle, pid)
      // The first marker is where the shell's pid becomes known: its line editing before it goes too.
      const kept = idle.filter((event) => !editsLine(event, pid)).map((event, seq) => ({ ...event, seq }))
      window = newWindow(text.slice(VM_TRACE_START.length).replace(HISTORY_NUMBER, '').trim(), kept, pid)
      trimming = true
      trimmedEnter = null
    } else if (text.startsWith(VM_TRACE_END)) {
      finish(text, VM_TRACE_END)
    }
  }

  /** Builds the data a write or read moved from its chunks, once its sys_exit gives the count. */
  const takeCapture = (pid: number, name: string, ret: number) => {
    const capture = window.captures.get(pid)
    window.captures.delete(pid)
    if (!capture || ret <= 0) {
      return undefined
    }
    if (name === 'writev') {
      return joinIovecs(capture.iovecs, capture.count, ret)
    }
    return joinChunks(capture.iovecs.get(0)?.chunks ?? new Map(), ret)
  }

  const onProbe = (record: TraceRecord & { kind: 'probe' }) => {
    const { pid, fields } = record
    const name = parseProbeName(record.probe)
    if (name?.kind === TRACE_PROBES.tty) {
      onTty(record, name.chunk)
      return
    }
    if (name) {
      const capture = window.captures.get(pid) ?? { ret: 0, count: 0, iovecs: new Map() }
      capture.ret = fieldNumber(fields.ret)
      capture.count = fieldNumber(fields.n)
      const iov = capture.iovecs.get(name.iov) ?? { length: fieldNumber(fields.l), chunks: new Map() }
      iov.chunks.set(name.chunk, chunkBytes(fields))
      capture.iovecs.set(name.iov, iov)
      window.captures.set(pid, capture)
      return
    }
    const index = window.lastEnter.get(pid)
    const enter = index === undefined ? undefined : window.events[index]
    if (index === undefined || enter?.type !== 'sys_enter') {
      return
    }
    const data = pathData(fields)
    const argv = record.probe === TRACE_PROBES.execve ? argvOf(fields) : undefined
    replace(index, { ...enter, ...(data && { data }), ...(argv && { argv }) })
  }

  const onTty = (record: TraceRecord & { kind: 'probe' }, chunk: number) => {
    const { pid, cpu, time, fields } = record
    const total = fieldNumber(fields.nr)
    const bytes = chunkBytes(fields)
    if (chunk === 0) {
      const index = window.events.length
      if (append({ type: 'console_write', pid, bytes: bytes.subarray(0, total), cpu }, time)) {
        window.lastTty.set(pid, index)
      } else {
        window.lastTty.delete(pid)
      }
      return
    }
    const index = window.lastTty.get(pid)
    const last = index === undefined ? undefined : window.events[index]
    if (index === undefined || last?.type !== 'console_write') {
      return
    }
    const joined = joinChunks(
      new Map([
        [0, last.bytes],
        [1, bytes],
      ]),
      Math.min(total, last.bytes.length + bytes.length)
    )
    replace(index, { ...last, bytes: joined.data })
  }

  const onRecord = (record: TraceRecord) => {
    if (record.kind === 'marker') {
      onMarker(record)
      return
    }
    const run = window
    const { pid, cpu, time } = record
    switch (record.kind) {
      case 'enter': {
        if (EXIT_SYSCALLS.has(record.name)) {
          run.exitCodes.set(pid, (record.args[0] ?? 0) & EXIT_CODE_MASK)
        }
        const index = window.events.length
        window.captures.delete(pid)
        const kept = append(
          { type: 'sys_enter', pid, nr: syscallNumber(record.name), name: record.name, args: record.args, cpu },
          time
        )
        if (kept) {
          window.lastEnter.set(pid, index)
        } else {
          window.lastEnter.delete(pid)
        }
        return
      }
      case 'exit': {
        const captured = takeCapture(pid, record.name, record.ret)
        if (run.skipShellExit && pid === run.markerPid) {
          run.skipShellExit = false
          return
        }
        // Between commands, a return whose call began before tracing reached its task.
        if (run.commandLine === null && !run.lastEnter.has(pid)) {
          return
        }
        if (captured && WRITE_SYSCALLS.has(record.name)) {
          const index = run.lastEnter.get(pid)
          const enter = index === undefined ? undefined : run.events[index]
          if (index !== undefined && enter?.type === 'sys_enter') {
            replace(index, { ...enter, data: captured.data, ...(captured.cut && { dataCut: true }) })
          }
        }
        const read = record.name === 'read' && captured && captured.data.length > 0 ? captured : undefined
        append(
          {
            type: 'sys_exit',
            pid,
            nr: syscallNumber(record.name),
            name: record.name,
            ret: record.ret,
            ...(read && { data: read.data, ...(read.cut && { dataCut: true }) }),
            cpu,
          },
          time
        )
        return
      }
      case 'probe':
        onProbe(record)
        return
      case 'event':
        onEvent(run, record, pid, cpu, time)
        return
    }
  }

  const onEvent = (run: Window, record: TraceRecord & { kind: 'event' }, pid: number, cpu: number, time: number) => {
    const { fields } = record
    const num = (key: string) => Number.parseInt(fields[key] ?? '0', 10)
    switch (record.name) {
      case 'sched_process_fork':
        append({ type: 'sched_process_fork', parentPid: num('pid'), childPid: num('child_pid'), cpu }, time)
        return
      case 'sched_process_exec':
        append(
          { type: 'sched_process_exec', pid: num('pid'), oldPid: num('old_pid'), filename: fields.filename ?? '', cpu },
          time
        )
        return
      case 'sched_process_exit': {
        // 6.18's sched_process_exit carries no code: it comes from exit()/exit_group(), or the
        // task died of the last signal it was handling.
        const code = run.exitCodes.get(pid)
        const signal = code === undefined ? run.lastSignal.get(pid) : undefined
        append({ type: 'sched_process_exit', pid, code: code ?? 0, ...(signal !== undefined && { signal }), cpu }, time)
        return
      }
      case 'sched_process_free':
        append({ type: 'sched_process_free', pid: num('pid'), cpu }, time)
        return
      case 'signal_generate': {
        const target = num('pid')
        const sig = num('sig')
        const fault = run.lastFault.get(target)
        if (sig === SIGSEGV && fault) {
          append(fault, time)
          run.lastFault.delete(target)
        }
        append(
          { type: 'signal_generate', pid: target, sig, result: SIGNAL_RESULTS[fields.res ?? '0'] ?? 'delivered', cpu },
          time
        )
        return
      }
      case 'signal_deliver':
        run.lastSignal.set(pid, num('sig'))
        append({ type: 'signal_deliver', pid, sig: num('sig'), cpu }, time)
        return
      case 'page_fault_user':
        run.lastFault.set(pid, {
          type: 'page_fault_user',
          pid,
          address: Number.parseInt(fields.address ?? '0', 16),
          ip: Number.parseInt(fields.ip ?? '0', 16),
          errorCode: Number.parseInt(fields.error_code ?? '0', 16),
          cpu,
        })
        return
    }
  }

  const flushProgress = () => {
    if (window.dirty && window.commandLine !== null) {
      window.dirty = false
      callbacks.onProgress({ commandLine: window.commandLine, status: null, events: window.events })
    }
  }

  return {
    /** Text from COM2, in any chunks: lines are put back together across them. */
    pushTrace(text: string) {
      const lines = (partial + text).split('\n')
      partial = lines.pop() ?? ''
      for (const line of lines) {
        const record = parseTraceLine(line.replace(/\r$/, ''))
        if (record) {
          onRecord(record)
        }
      }
      flushProgress()
    },
  }
}
