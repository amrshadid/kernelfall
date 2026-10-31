import type { XrayCall } from '@features/xray/types'
import { toXrayCalls } from '@features/xray/utils/calls'
import { xrayContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { bytes, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { forkChoices, returnOf, syscallValues, writeChoices } from './syscall-values.util'

const content = xrayContent()

function writeReturning(ret: number): XrayCall {
  const events = stamp([
    { type: 'sys_enter', pid: 2, nr: 1, name: 'write', args: [1, 0x10000, 6], data: bytes('hello\n') },
    { type: 'sys_exit', pid: 2, nr: 1, name: 'write', ret },
  ])
  const [call] = toXrayCalls(runOf(events, './hello'), events, content)
  if (!call) {
    throw new Error('no call')
  }
  return call
}

describe('returnOf', () => {
  it('is the outcome of a call that returned, and null otherwise', () => {
    expect(returnOf(writeReturning(6))).toMatchObject({ ret: 6 })
    expect(returnOf({ ...writeReturning(6), outcome: { kind: 'pending' } })).toBeNull()
  })
})

describe('writeChoices', () => {
  it('offers four distinct numbers, the answer among them, in order', () => {
    expect(writeChoices(writeReturning(6))).toEqual({ answer: '6', options: ['-1', '0', '1', '6'] })
  })
})

describe('forkChoices', () => {
  it("offers the child's PID against 0, the parent's PID and -1, and nothing for a failed fork", () => {
    const fork: XrayCall = { ...writeReturning(3), name: 'clone', family: 'fork' }
    expect(forkChoices(fork)).toEqual({ answer: '3', options: ['-1', '0', '2', '3'] })
    expect(forkChoices({ ...fork, outcome: { kind: 'returned', ret: -11, errno: 'EAGAIN', toProgram: -1 } })).toBeNull()
  })
})

describe('syscallValues', () => {
  const parts = content.narration.parts

  it('says why a full write returned what it did', () => {
    const values = syscallValues(writeReturning(6), parts)
    expect(values.writeExplain).toContain('It returned 6, the number of bytes written.')
    expect(values.shortWrite).toBe('')
    expect(values.meaning).toBe(', the number of bytes written')
    expect(values.arguments).toBe(' The arguments go in order: `ebx` = fd 1, `ecx` = buf 0x10000, `edx` = count 6.')
  })

  it('says a short write is short, and an error is -1', () => {
    expect(syscallValues(writeReturning(2), parts).shortWrite).toBe(' Only 2 of 6 bytes went: a short write.')
    expect(syscallValues(writeReturning(-9), parts).writeExplain).toContain('the kernel answered `-EBADF`')
  })
})
