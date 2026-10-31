import type { CallBuffer, CallOutcome, XrayCall } from '@features/xray/types'
import type { XrayContent } from '@kernelfall/levels/types'
import type { RunEvent } from '@kernelfall/machine/hooks'
import type { TraceCall, TraceRun } from '@kernelfall/machine/types'
import { ERRNO_TABLE } from '@kernelfall/machine/types'
import { formatCall, isErrorReturn, syscallName } from '@kernelfall/machine/utils'
import { baseName, programOf } from './program-name.util'
import { syscallContent } from './syscall-content.util'
import { ARG_REGISTERS, MAX_BUFFER_CELLS, PT_REGS_FIELDS } from './xray-call.constants'

const SPACE = 0x20
const NEWLINE = 0x0a
const TAB = 0x09
const DELETE = 0x7f
const OCTAL = 8
const HEX = 16

const decoder = new TextDecoder()

const hex = (value: number) => `0x${value.toString(HEX)}`

/** One byte as a cell label: the character, or a visible stand-in. */
export function cellLabel(byte: number): string {
  switch (byte) {
    case SPACE:
      return '␠'
    case NEWLINE:
      return '\\n'
    case TAB:
      return '\\t'
    case 0:
      return '\\0'
    default:
      return byte > SPACE && byte < DELETE ? String.fromCharCode(byte) : `\\${byte.toString(OCTAL)}`
  }
}

function bufferOf(call: TraceCall): CallBuffer | null {
  if (call.name !== 'write' || !call.data) {
    return null
  }
  const count = call.args[2] ?? 0
  const shown = call.data.subarray(0, Math.min(count, MAX_BUFFER_CELLS))
  return {
    address: hex(call.args[1] ?? 0),
    cells: [...shown].map(cellLabel),
    more: count > shown.length,
    count,
  }
}

function outcomeOf(call: TraceCall): CallOutcome {
  const { result } = call
  if (result.kind !== 'returned') {
    return result
  }
  const failed = isErrorReturn(result.ret)
  return {
    kind: 'returned',
    ret: result.ret,
    errno: failed ? (ERRNO_TABLE.get(-result.ret)?.name ?? `errno ${-result.ret}`) : null,
    toProgram: failed ? -1 : result.ret,
  }
}

/** The call as a programmer reads it: strace's form where the trace has one, the path quoted. */
function callText(call: TraceCall, path: string | null, pathArg: number | null, pointers: readonly number[]): string {
  if (pathArg === null || path === null) {
    return formatCall(call)
  }
  const args = call.args.map((value, i) => {
    if (i === pathArg) {
      return JSON.stringify(path)
    }
    return pointers.includes(i) ? hex(value) : String(value)
  })
  return `${call.name}(${args.join(', ')})`
}

export function toXrayCalls(run: TraceRun, events: readonly RunEvent[], content: XrayContent): readonly XrayCall[] {
  const programs = new Map<number, string>()
  const printed = new Map<number, string>()
  const programAt = new Map<number, string>()
  let writing: number | null = null
  const first = programOf(run.commandLine)
  if (run.pid !== null) {
    programs.set(run.pid, first)
  }

  for (const event of events) {
    switch (event.type) {
      case 'sys_enter':
        programAt.set(event.seq, programs.get(event.pid) ?? first)
        if (event.name === 'write') {
          writing = event.seq
        }
        break
      case 'sys_exit':
        if (event.name === 'write') {
          writing = null
        }
        break
      case 'console_write':
        if (writing !== null) {
          printed.set(writing, (printed.get(writing) ?? '') + decoder.decode(event.bytes))
        }
        break
      case 'sched_process_fork':
        programs.set(event.childPid, programs.get(event.parentPid) ?? first)
        break
      case 'sched_process_exec':
        programs.set(event.pid, baseName(event.filename))
        break
      default:
        break
    }
  }

  return run.calls.map((traced) => {
    // The trace names some calls by their kernel entry (newuname); players read strace's names.
    const call = { ...traced, name: syscallName(traced.name) }
    const about = syscallContent(content, call.name, call.args.length)
    const path = about.pathArg !== null && call.data ? decoder.decode(call.data) : null
    return {
      id: call.id,
      pid: call.pid,
      program: programAt.get(call.id) ?? first,
      name: call.name,
      nr: call.nr,
      family: about.family,
      text: callText(call, path, about.pathArg, about.pointers),
      args: about.args.map((name, i) => {
        const value = call.args[i] ?? 0
        return {
          register: ARG_REGISTERS[i] ?? `arg${i}`,
          ptReg: PT_REGS_FIELDS[i] ?? `arg${i}`,
          name,
          value: about.pointers.includes(i) ? hex(value) : String(value),
        }
      }),
      buffer: bufferOf(call),
      path,
      outcome: outcomeOf(call),
      console: printed.get(call.id) ?? null,
      kernelPath: about.path,
      desk: about.desk,
      sources: about.sources,
      returns: about.returns,
    }
  })
}

/** The first write, where the output is, or else the first call. */
export function defaultCallId(calls: readonly XrayCall[]): number | null {
  return (calls.find((call) => call.family === 'write') ?? calls[0])?.id ?? null
}
