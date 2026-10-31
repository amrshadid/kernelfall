import {
  TRACE_FAULT,
  TRACE_PROBES,
  VM_TRACE_ARGV,
  VM_TRACE_CHUNK_BYTES,
  VM_TRACE_CHUNK_WORDS,
} from '#types/definitions/vm-trace'

const WORD_BYTES = 4

/** Bytes a probe read from a buffer, and whether the call moved more than that. */
export interface CapturedData {
  readonly data: Uint8Array
  readonly cut: boolean
}

/** A probe's name taken apart: `writev_1_0` is iovec 1's first chunk; `write_2`, write's third. */
export interface ProbeName {
  readonly kind: string
  readonly iov: number
  readonly chunk: number
}

/** x32 words as the probe printed them, back to the bytes in memory (i386 is little-endian). */
export function wordsToBytes(words: readonly (string | undefined)[], length: number): Uint8Array {
  const bytes = new Uint8Array(Math.max(0, Math.min(length, words.length * WORD_BYTES)))
  for (let i = 0; i < bytes.length; i++) {
    const word = words[Math.floor(i / WORD_BYTES)]
    const value = word === undefined || word === TRACE_FAULT ? 0 : Number.parseInt(word, 16)
    bytes[i] = (value >>> ((i % WORD_BYTES) * 8)) & 0xff
  }
  return bytes
}

/** A probe field as a number: hex or decimal, as 32 bits signed (-EFAULT is 0xfffffff2). */
export const fieldNumber = (value: string | undefined): number =>
  value === undefined || value === TRACE_FAULT
    ? 0
    : Number.parseInt(value, value.startsWith('0x') || value.startsWith('-0x') ? 16 : 10) | 0

const CHUNKED = new Set<string>([TRACE_PROBES.write, TRACE_PROBES.read, TRACE_PROBES.tty])

/** The buffer probes' names, or null for a probe that reads no chunked buffer (execve, paths). */
export function parseProbeName(probe: string): ProbeName | null {
  const parts = probe.split('_')
  const kind = parts[0] ?? ''
  const numbers = parts.slice(1).map(Number)
  if (kind === TRACE_PROBES.writev && numbers.length === 2) {
    return { kind, iov: numbers[0] ?? 0, chunk: numbers[1] ?? 0 }
  }
  if (CHUNKED.has(kind) && numbers.length === 1) {
    return { kind, iov: 0, chunk: numbers[0] ?? 0 }
  }
  return null
}

/** One chunk's words as bytes: the whole chunk, cut later to what the call moved. */
export const chunkBytes = (fields: Readonly<Record<string, string>>): Uint8Array =>
  wordsToBytes(
    Array.from({ length: VM_TRACE_CHUNK_WORDS }, (_, i) => fields[`b${i}`]),
    VM_TRACE_CHUNK_BYTES
  )

/** Chunks by index, joined in order up to `length`; a missing chunk ends the capture there. */
export function joinChunks(chunks: ReadonlyMap<number, Uint8Array>, length: number): CapturedData {
  const wanted = Math.max(0, length)
  const out = new Uint8Array(wanted)
  let filled = 0
  for (let chunk = 0; filled < wanted; chunk++) {
    const bytes = chunks.get(chunk)
    if (!bytes) {
      break
    }
    const part = bytes.subarray(0, wanted - filled)
    out.set(part, filled)
    filled += part.length
  }
  return { data: out.subarray(0, filled), cut: filled < wanted }
}

/** writev()'s iovecs, each from its chunks up to its length, joined as the file got them, cut at `ret`. */
export function joinIovecs(
  iovecs: ReadonlyMap<number, { readonly length: number; readonly chunks: ReadonlyMap<number, Uint8Array> }>,
  count: number,
  ret: number
): CapturedData {
  const parts: Uint8Array[] = []
  let cut = false
  let left = Math.max(0, ret)
  for (let iov = 0; iov < count && left > 0; iov++) {
    const found = iovecs.get(iov)
    if (!found) {
      cut = true
      break
    }
    const part = joinChunks(found.chunks, Math.min(found.length, left))
    parts.push(part.data)
    left -= Math.min(found.length, left)
    if (part.cut) {
      cut = true
      break
    }
  }
  if (left > 0) {
    cut = true
  }
  const data = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    data.set(part, offset)
    offset += part.length
  }
  return { data, cut }
}

/** execve()'s argv up to its NULL, which the probe reads as a fault. */
export function argvOf(fields: Readonly<Record<string, string>>): string[] {
  const argv: string[] = []
  for (let i = 0; i < VM_TRACE_ARGV; i++) {
    const value = fields[`a${i}`]
    if (value === undefined || value === TRACE_FAULT) {
      break
    }
    argv.push(value)
  }
  return argv
}

/** The first path a call names (`p0`, or execve's `path`), without its NUL. */
export function pathData(fields: Readonly<Record<string, string>>): Uint8Array | undefined {
  const path = fields.path ?? fields.p0
  return path === undefined || path === TRACE_FAULT ? undefined : new TextEncoder().encode(path)
}
