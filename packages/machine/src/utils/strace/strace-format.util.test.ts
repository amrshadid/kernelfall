import { utf8Encode } from '@kernelfall/core/utils'
import { describe, expect, it } from 'vitest'
import type { TraceCall } from '#types/definitions/trace'
import {
  formatCall,
  formatExitLine,
  formatReturn,
  formatStraceLine,
  quoteBuffer,
} from '#utils/strace/strace-format.util'

const bytes = utf8Encode

function writeCall(text: string, result: TraceCall['result'] = { kind: 'returned', ret: 0 }) {
  const data = bytes(text)
  return {
    id: 0,
    pid: 2,
    nr: 1,
    name: 'write',
    args: [1, 0x10000, data.length],
    data,
    result,
  } satisfies TraceCall
}

describe('quoteBuffer', () => {
  it('uses C escapes for quotes, backslashes and whitespace', () => {
    expect(quoteBuffer(bytes('a"b\\c\n\t\r\v\f'), 11)).toBe('"a\\"b\\\\c\\n\\t\\r\\v\\f"')
  })

  it('prints other bytes, including UTF-8, as short octal', () => {
    expect(quoteBuffer(bytes('hé\x1b!'), 5)).toBe('"h\\303\\251\\33!"')
    expect(quoteBuffer(new Uint8Array([0]), 1)).toBe('"\\0"')
  })

  it('pads octal to three digits when an octal digit follows', () => {
    expect(quoteBuffer(new Uint8Array([0, 0x31, 0x1b, 0x38]), 4)).toBe('"\\0001\\338"')
  })

  it('stops at 32 bytes and adds ... when the call covered more', () => {
    const long = 'a'.repeat(40)
    expect(quoteBuffer(bytes(long), 40)).toBe(`"${'a'.repeat(32)}"...`)
    expect(quoteBuffer(bytes('a'.repeat(32)), 32)).toBe(`"${'a'.repeat(32)}"`)
  })

  it('only shows the bytes the call covers', () => {
    expect(quoteBuffer(bytes('hello'), 2)).toBe('"he"')
  })
})

describe('formatCall', () => {
  it('decodes write like strace', () => {
    expect(formatCall(writeCall('hello kernel\n'))).toBe('write(1, "hello kernel\\n", 13)')
  })

  it('prints an unreadable buffer as its address and a null one as NULL', () => {
    const { data: _, ...unreadable } = writeCall('abcd')
    expect(formatCall({ ...unreadable, args: [1, 0xdead0000, 4] })).toBe('write(1, 0xdead0000, 4)')
    expect(formatCall({ ...unreadable, args: [1, 0, 0] })).toBe('write(1, NULL, 0)')
  })

  it('decodes read with the bytes it returned, or its address before it returns', () => {
    const base = { id: 0, pid: 2, nr: 3, name: 'read', args: [3, 0xb7ee50b0, 1024], data: bytes('root:x:0:0') }
    expect(formatCall({ ...base, result: { kind: 'returned', ret: 10 } })).toBe('read(3, "root:x:0:0", 1024)')
    expect(formatCall({ ...base, result: { kind: 'pending' } })).toBe('read(3, 0xb7ee50b0, 1024)')
    expect(formatCall({ ...base, result: { kind: 'returned', ret: 0 } })).toBe('read(3, 0xb7ee50b0, 1024)')
  })

  it('decodes getpid, exit_group and unknown syscalls', () => {
    const base = { id: 0, pid: 2, nr: 0, result: { kind: 'pending' } } as const
    expect(formatCall({ ...base, name: 'getpid', args: [] })).toBe('getpid()')
    expect(formatCall({ ...base, name: 'exit_group', args: [3] })).toBe('exit_group(3)')
    expect(formatCall({ ...base, name: 'syscall_9999', args: [0, 255] })).toBe('syscall_9999(0, 0xff)')
  })
})

describe('formatReturn', () => {
  it('prints values, errors with glibc text, and calls that never return', () => {
    expect(formatReturn({ kind: 'returned', ret: 13 })).toBe('= 13')
    expect(formatReturn({ kind: 'returned', ret: -9 })).toBe('= -1 EBADF (Bad file descriptor)')
    expect(formatReturn({ kind: 'returned', ret: -38 })).toBe('= -1 ENOSYS (Function not implemented)')
    expect(formatReturn({ kind: 'returned', ret: -4000 })).toBe('= -1 ERRNO_4000 (Unknown error 4000)')
    expect(formatReturn({ kind: 'exited' })).toBe('= ?')
  })
})

describe('formatStraceLine', () => {
  it('aligns the return value to column 40', () => {
    const line = formatStraceLine(writeCall('hi\n', { kind: 'returned', ret: 3 }))
    expect(line).toBe(`${'write(1, "hi\\n", 3) '.padEnd(40)}= 3`)
    expect(line.indexOf('=')).toBe(40)
  })

  it('uses a single space when the call is longer than the column', () => {
    const text = 'hello kernel, from userland\n'
    expect(formatStraceLine(writeCall(text, { kind: 'returned', ret: 28 }))).toBe(
      'write(1, "hello kernel, from userland\\n", 28) = 28'
    )
  })

  it('ends exit_group with = ? and the exit line follows', () => {
    const call = { id: 0, pid: 2, nr: 231, name: 'exit_group', args: [0] } as const
    expect(formatStraceLine({ ...call, result: { kind: 'exited' } })).toBe(`${'exit_group(0) '.padEnd(40)}= ?`)
    expect(formatExitLine(0)).toBe('+++ exited with 0 +++')
  })
})
