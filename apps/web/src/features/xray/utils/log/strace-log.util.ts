import type { CallTone, LogLine, LogRun, OutputStream } from '@features/xray/types'
import type { CallResult, TraceCall, TraceRun } from '@kernelfall/machine/types'
import { formatExitLine, formatReturn, formatStraceLine, isErrorReturn } from '@kernelfall/machine/utils'

/** Syscalls whose first argument is the file descriptor they write to. */
const WRITES = new Set(['write', 'writev', 'pwrite64', 'pwritev', 'pwritev2'])
const STREAMS: Readonly<Record<number, OutputStream>> = { 1: 'stdout', 2: 'stderr' }

/** Which standard stream a call writes to, by its fd number. */
export function streamOf(call: Pick<TraceCall, 'name' | 'args'>): OutputStream | null {
  const fd = call.args[0]
  return WRITES.has(call.name) && fd !== undefined ? (STREAMS[fd] ?? null) : null
}

export function toneOf(result: CallResult): CallTone {
  switch (result.kind) {
    case 'exited':
      return 'exit'
    case 'pending':
      return 'pending'
    case 'returned':
      return isErrorReturn(result.ret) ? 'error' : 'ok'
  }
}

/** Explains a command that started no process, so the trace has nothing of its own. */
function noSyscallsNote(run: TraceRun): string {
  const program = run.commandLine.trim().split(/\s+/)[0] ?? ''
  return `No syscalls traced for ${program}: no new process started. Bash runs builtins like cd and echo itself.`
}

export function toLogRun(run: TraceRun): LogRun {
  const lines: LogLine[] = run.calls.map((call) => {
    const text = formatStraceLine(call)
    const returned = formatReturn(call.result)
    return {
      kind: 'call',
      id: call.id,
      head: text.slice(0, text.length - returned.length),
      returned,
      tone: toneOf(call.result),
      stream: streamOf(call),
    }
  })
  if (run.exitCode !== null) {
    lines.push({ kind: 'exit', text: formatExitLine(run.exitCode) })
  }
  return {
    id: run.id,
    commandLine: run.commandLine,
    lines,
    note: run.calls.length === 0 ? noSyscallsNote(run) : null,
  }
}
