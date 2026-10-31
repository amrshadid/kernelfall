import { ERRNO_TABLE } from '#types/definitions/errno-names'
import type { TraceCall } from '#types/definitions/trace'

// Formats syscalls exactly as strace(1) prints them, so what players learn here
// matches what they see on a real machine.

/** strace's default string limit (`-s 32`): longer buffers print 32 bytes and `...`. */
export const STRACE_MAX_STRLEN = 32
/** The column strace aligns ` = ` to (`-a 40`). */
export const STRACE_ALIGN_COLUMN = 40
/** Largest errno: return values in [-MAX_ERRNO, -1] are errors (include/linux/err.h). */
const MAX_ERRNO = 4095

const NAMED_ESCAPES: ReadonlyMap<number, string> = new Map([
  [0x22, '\\"'],
  [0x5c, '\\\\'],
  [0x0c, '\\f'],
  [0x0a, '\\n'],
  [0x0d, '\\r'],
  [0x09, '\\t'],
  [0x0b, '\\v'],
])

const isPrintableAscii = (byte: number) => byte >= 0x20 && byte <= 0x7e
const isOctalDigit = (byte: number | undefined) => byte !== undefined && byte >= 0x30 && byte <= 0x37

/**
 * Escapes one non-printable byte as octal, as strace's string_quote() does:
 * as short as possible, unless the next byte is an octal digit that would
 * merge into the escape.
 */
function octalEscape(byte: number, next: number | undefined): string {
  const octal = byte.toString(8)
  return `\\${isOctalDigit(next) ? octal.padStart(3, '0') : octal}`
}

/**
 * Quotes a user buffer the way strace prints it: C escapes, octal for other
 * bytes (UTF-8 too), at most STRACE_MAX_STRLEN bytes, then `...` if the call
 * covered more bytes than were printed.
 */
export function quoteBuffer(data: Uint8Array, count: number): string {
  const shown = data.subarray(0, Math.min(count, STRACE_MAX_STRLEN))
  let text = ''
  shown.forEach((byte, i) => {
    text +=
      NAMED_ESCAPES.get(byte) ?? (isPrintableAscii(byte) ? String.fromCharCode(byte) : octalEscape(byte, shown[i + 1]))
  })
  return `"${text}"${count > STRACE_MAX_STRLEN ? '...' : ''}`
}

/** Prints a pointer the way strace does when it can't (or won't) read through it. */
export function formatPointer(addr: number): string {
  return addr === 0 ? 'NULL' : `0x${addr.toString(16)}`
}

/** Like printf's `%#lx`, which strace uses for raw arguments: `0` stays `0`. */
const formatHex = (value: number) => (value === 0 ? '0' : `0x${value.toString(16)}`)

function formatBufferArg(call: TraceCall, addrIndex: number, countIndex: number): string {
  const addr = call.args[addrIndex] ?? 0
  if (addr === 0 || !call.data) {
    return formatPointer(addr)
  }
  return quoteBuffer(call.data, call.args[countIndex] ?? 0)
}

/** The argument list, decoded per syscall like strace. Unknown syscalls show raw hex. */
export function formatArgs(call: TraceCall): string {
  const arg = (i: number) => call.args[i] ?? 0
  switch (call.name) {
    case 'write':
      return `${arg(0)}, ${formatBufferArg(call, 1, 2)}, ${arg(2)}`
    case 'read':
      // strace prints what read() returned, not the size it asked for.
      return call.result.kind === 'returned' && call.result.ret > 0 && call.data
        ? `${arg(0)}, ${quoteBuffer(call.data, call.result.ret)}, ${arg(2)}`
        : `${arg(0)}, ${formatPointer(arg(1))}, ${arg(2)}`
    case 'getpid':
      return ''
    case 'exit':
    case 'exit_group':
      return `${arg(0)}`
    default:
      return call.args.map(formatHex).join(', ')
  }
}

/** `name(args)`, the left half of a strace line. */
export function formatCall(call: TraceCall): string {
  return `${call.name}(${formatArgs(call)})`
}

/** `= value`, `= -1 ENAME (message)`, `= ?` for a call that never returns. */
export function formatReturn(result: TraceCall['result']): string {
  switch (result.kind) {
    case 'exited':
      return '= ?'
    case 'pending':
      return '<unfinished ...>'
    case 'returned':
      return isErrorReturn(result.ret) ? formatError(-result.ret) : `= ${result.ret}`
  }
}

export function isErrorReturn(ret: number): boolean {
  return ret < 0 && ret >= -MAX_ERRNO
}

function formatError(errno: number): string {
  const info = ERRNO_TABLE.get(errno)
  return info ? `= -1 ${info.name} (${info.message})` : `= -1 ERRNO_${errno} (Unknown error ${errno})`
}

/** One complete strace line, with ` = ` aligned to STRACE_ALIGN_COLUMN like strace. */
export function formatStraceLine(call: TraceCall): string {
  const left = formatCall(call)
  const returned = formatReturn(call.result)
  if (call.result.kind === 'pending') {
    return `${left} ${returned}`
  }
  // strace prints ") ", then pads to the column, then "= ...".
  return `${`${left} `.padEnd(STRACE_ALIGN_COLUMN)}${returned}`
}

/** The line strace prints when the traced process exits. */
export function formatExitLine(code: number): string {
  return `+++ exited with ${code} +++`
}
