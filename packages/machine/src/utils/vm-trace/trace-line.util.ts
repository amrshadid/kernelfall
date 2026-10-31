import type { TraceHeader, TraceRecord } from '#types/definitions/vm-trace'

// `<comm>-<pid> [<cpu>] <flags> <sec>.<usec>: <payload>`; a comm may itself contain '-'.
const LINE = /^\s*(.+)-(\d+)\s+\[(\d+)\]\s+\S+\s+(\d+)\.(\d+):\s(.*)$/
const ENTER = /^sys_(\w+)\((.*)\)$/
const EXIT = /^sys_(\w+) -> (\S+)$/
const MARKER = /^tracing_mark_write: (.*)$/
// An eprobe names its base event `(syscalls.sys_enter_execve)`, a return probe where it returned to
// and from `(__ia32_sys_read+0x10/0x20 <- ksys_read)`, a kprobe its place `(n_tty_write+0x0/0x4e0)`.
const PROBE = /^(\w+): \((?:syscalls\.sys_enter_\w+|\S+ <- \w+|[\w.]+\+0x[0-9a-f]+\/0x[0-9a-f]+)\)\s?(.*)$/
const EVENT = /^(\w+): (.*)$/
const FIELD = /(\w+)=("(?:[^"\\]|\\.)*"|\S+)/g
const NS_PER_USEC = 1000
const NS_PER_SEC = 1_000_000_000

/** A tracepoint prints values in hex; returns are 32-bit words, so -2 arrives as 0xfffffffe. */
export function signed32(value: string): number {
  const parsed = value.startsWith('0x') ? Number.parseInt(value, 16) : Number.parseInt(value, 10)
  return parsed | 0
}

/** `fd: 1, buf: 0xbf8e…, count: 6` → [1, 0xbf8e…, 6]. */
function enterArgs(text: string): number[] {
  if (text.trim() === '') {
    return []
  }
  return text.split(', ').map((pair) => {
    const value = pair.slice(pair.indexOf(': ') + 2)
    return Number.parseInt(value, value.startsWith('0x') ? 16 : 10) >>> 0
  })
}

/** `k=v k2="a b"` → { k: 'v', k2: 'a b' }; quoted strings lose their quotes. */
export function traceFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const [, key, raw] of text.matchAll(FIELD)) {
    if (key !== undefined && raw !== undefined) {
      fields[key] = raw.startsWith('"') ? raw.slice(1, -1).replace(/\\(.)/g, '$1') : raw
    }
  }
  return fields
}

/** One trace_pipe line, or null for anything else (a blank line, a lost-events note). */
export function parseTraceLine(line: string): TraceRecord | null {
  const match = LINE.exec(line)
  if (!match) {
    return null
  }
  const [, comm = '', pid = '0', cpu = '0', sec = '0', usec = '0', payload = ''] = match
  const header: TraceHeader = {
    comm,
    pid: Number(pid),
    cpu: Number(cpu),
    time: Number(sec) * NS_PER_SEC + Number(usec) * NS_PER_USEC,
  }
  const enter = ENTER.exec(payload)
  if (enter) {
    return { ...header, kind: 'enter', name: enter[1] ?? '', args: enterArgs(enter[2] ?? '') }
  }
  const exit = EXIT.exec(payload)
  if (exit) {
    return { ...header, kind: 'exit', name: exit[1] ?? '', ret: signed32(exit[2] ?? '0') }
  }
  const marker = MARKER.exec(payload)
  if (marker) {
    return { ...header, kind: 'marker', text: marker[1] ?? '' }
  }
  const probe = PROBE.exec(payload)
  if (probe) {
    return { ...header, kind: 'probe', probe: probe[1] ?? '', fields: traceFields(probe[2] ?? '') }
  }
  const event = EVENT.exec(payload)
  if (event) {
    return { ...header, kind: 'event', name: event[1] ?? '', fields: traceFields(event[2] ?? '') }
  }
  return null
}
