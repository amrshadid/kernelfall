import { xrayContent } from '@kernelfall/levels/utils'
import type { RunEvent } from '@kernelfall/machine/hooks'
import { describe, expect, it } from 'vitest'
import { bytes, ECHO, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { MAX_BUFFER_CELLS } from './xray-call.constants'
import { cellLabel, defaultCallId, toXrayCalls } from './xray-call.util'

const callsOf = (events: RunEvent[], commandLine = 'echo hello') =>
  toXrayCalls(runOf(events, commandLine), events, xrayContent())

describe('toXrayCalls', () => {
  it('gives each call its registers, buffer, output and outcome from the events', () => {
    const [write, exit] = callsOf(ECHO)

    expect(write).toMatchObject({
      program: 'echo',
      pid: 2,
      name: 'write',
      nr: 1,
      family: 'write',
      text: 'write(1, "hello\\n", 6)',
      console: 'hello\n',
      outcome: { kind: 'returned', ret: 6, errno: null, toProgram: 6 },
      buffer: { address: '0x10000', cells: ['h', 'e', 'l', 'l', 'o', '\\n'], more: false, count: 6 },
      returns: 'the number of bytes written',
    })
    expect(write?.args).toEqual([
      { register: 'ebx', ptReg: 'bx', name: 'fd', value: '1' },
      { register: 'ecx', ptReg: 'cx', name: 'buf', value: '0x10000' },
      { register: 'edx', ptReg: 'dx', name: 'count', value: '6' },
    ])
    expect(exit).toMatchObject({ name: 'exit_group', family: 'exit', outcome: { kind: 'exited' }, console: null })
  })

  it('opens on the first write, where the output is', () => {
    const calls = callsOf(ECHO)
    expect(defaultCallId(calls)).toBe(calls[0]?.id)
    expect(defaultCallId([])).toBeNull()
  })

  it('turns a failed write into -1 and errno for the program', () => {
    const events = stamp([
      { type: 'sys_enter', pid: 2, nr: 1, name: 'write', args: [7, 0x10000, 3], data: bytes('hi\n') },
      { type: 'sys_exit', pid: 2, nr: 1, name: 'write', ret: -9 },
    ])
    expect(callsOf(events, './hello')[0]?.outcome).toEqual({ kind: 'returned', ret: -9, errno: 'EBADF', toProgram: -1 })
  })

  it('quotes the path of an execve and names the program after it', () => {
    const events = stamp([
      { type: 'sys_enter', pid: 2, nr: 59, name: 'execve', args: [0x1000, 0x2000, 0x3000], data: bytes('/bin/ls') },
      { type: 'sched_process_exec', pid: 2, oldPid: 2, filename: '/bin/ls' },
      { type: 'sys_exit', pid: 2, nr: 59, name: 'execve', ret: 0 },
      { type: 'sys_enter', pid: 2, nr: 1, name: 'write', args: [1, 0x10000, 2], data: bytes('a\n') },
      { type: 'sys_exit', pid: 2, nr: 1, name: 'write', ret: 2 },
    ])
    const [execve, write] = callsOf(events, './sh')
    expect(execve).toMatchObject({ text: 'execve("/bin/ls", 0x2000, 0x3000)', path: '/bin/ls', program: 'sh' })
    expect(write?.program).toBe('ls')
  })

  it('draws a long buffer as its first cells and says there is more', () => {
    const text = 'a'.repeat(MAX_BUFFER_CELLS + 4)
    const events = stamp([
      { type: 'sys_enter', pid: 2, nr: 1, name: 'write', args: [1, 0x10000, text.length], data: bytes(text) },
    ])
    expect(callsOf(events)[0]?.buffer).toMatchObject({ more: true, count: text.length })
    expect(callsOf(events)[0]?.buffer?.cells).toHaveLength(MAX_BUFFER_CELLS)
  })
})

describe('cellLabel', () => {
  it('shows printable bytes as themselves and the rest as visible stand-ins', () => {
    expect([0x41, 0x20, 0x0a, 0x09, 0, 0x7f, 0x1b].map(cellLabel)).toEqual([
      'A',
      '␠',
      '\\n',
      '\\t',
      '\\0',
      '\\177',
      '\\33',
    ])
  })
})
