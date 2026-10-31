import { describe, expect, it } from 'vitest'
import {
  argvOf,
  chunkBytes,
  fieldNumber,
  joinChunks,
  joinIovecs,
  parseProbeName,
  pathData,
  wordsToBytes,
} from '#utils/vm-trace/trace-data.util'
import { traceFields } from '#utils/vm-trace/trace-line.util'

const text = (bytes: Uint8Array | undefined) => new TextDecoder().decode(bytes)
const bytes = (value: string) => new TextEncoder().encode(value)

describe('the data a probe read', () => {
  it('turns little-endian words back into bytes, cut at the length', () => {
    expect(text(wordsToBytes(['0x6c6c6568', '0x7472616f'], 5))).toBe('hello')
  })

  it('reads fields as 32-bit signed numbers, hex or decimal', () => {
    expect(fieldNumber('0xfffffff2')).toBe(-14)
    expect(fieldNumber('-14')).toBe(-14)
    expect(fieldNumber('300')).toBe(300)
    expect(fieldNumber('(fault)')).toBe(0)
  })

  it('takes probe names apart into the buffer, its iovec and its chunk', () => {
    expect(parseProbeName('write_2')).toEqual({ kind: 'write', iov: 0, chunk: 2 })
    expect(parseProbeName('writev_3_1')).toEqual({ kind: 'writev', iov: 3, chunk: 1 })
    expect(parseProbeName('tty_0')).toEqual({ kind: 'tty', iov: 0, chunk: 0 })
    expect(parseProbeName('splice_7')).toEqual({ kind: 'splice', iov: 0, chunk: 7 })
    expect(parseProbeName('splice_begin')).toBeNull()
    expect(parseProbeName('path_open')).toBeNull()
    expect(parseProbeName('execve')).toBeNull()
  })

  it('joins chunks in order up to the count, and says when the capture stops short of it', () => {
    const first = chunkBytes(traceFields('b0=0x6c6c6568 b1=0x6f'))
    expect(first).toHaveLength(256)
    expect(joinChunks(new Map([[0, first]]), 5)).toEqual({ data: bytes('hello'), cut: false })
    expect(joinChunks(new Map([[0, first]]), 300)).toMatchObject({ cut: true })
    expect(joinChunks(new Map([[0, first]]), 300).data).toHaveLength(256)
    expect(joinChunks(new Map(), 0)).toEqual({ data: new Uint8Array(), cut: false })
  })

  it("joins writev()'s iovecs as the file got them, cut at what it returned", () => {
    const iovecs = new Map([
      [0, { length: 5, chunks: new Map([[0, bytes('hello')]]) }],
      [1, { length: 1, chunks: new Map([[0, bytes('\n')]]) }],
    ])
    expect(joinIovecs(iovecs, 2, 6)).toEqual({ data: bytes('hello\n'), cut: false })
    expect(joinIovecs(iovecs, 2, 3)).toEqual({ data: bytes('hel'), cut: false })
    // Six iovecs, only the first two read: the rest were past the probes.
    expect(joinIovecs(iovecs, 6, 9)).toMatchObject({ data: bytes('hello\n'), cut: true })
  })

  it('stops argv at its NULL, and reads the path a call names', () => {
    const fields = traceFields('path="/bin/cat" a0="cat" a1="/etc/hostname" a2=(fault) a3=(fault)')
    expect(argvOf(fields)).toEqual(['cat', '/etc/hostname'])
    expect(text(pathData(fields))).toBe('/bin/cat')
    expect(text(pathData(traceFields('p0="/tmp/h"')))).toBe('/tmp/h')
    expect(pathData(traceFields('p0=(fault)'))).toBeUndefined()
  })
})
