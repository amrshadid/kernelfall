import type { TraceRun } from '@kernelfall/machine/types'
import { describe, expect, it } from 'vitest'
import { streamOf, toLogRun } from './strace-log.util'

const echo: TraceRun = {
  id: 1,
  commandLine: 'echo hello kernel',
  status: 0,
  pid: 1,
  exitCode: 0,
  calls: [
    {
      id: 0,
      pid: 1,
      nr: 1,
      name: 'write',
      args: [1, 0x10000, 13],
      data: new TextEncoder().encode('hello kernel\n'),
      result: { kind: 'returned', ret: 13 },
    },
    { id: 3, pid: 1, nr: 231, name: 'exit_group', args: [0], result: { kind: 'exited' } },
  ],
}

describe('toLogRun', () => {
  it('prints echo exactly as strace would', () => {
    const log = toLogRun(echo)
    const text = log.lines.map((l) => (l.kind === 'call' ? l.head + l.returned : l.text))
    expect(text).toEqual([
      `${'write(1, "hello kernel\\n", 13) '.padEnd(40)}= 13`,
      `${'exit_group(0) '.padEnd(40)}= ?`,
      '+++ exited with 0 +++',
    ])
    expect(log.lines[0]).toMatchObject({ kind: 'call', id: 0, returned: '= 13', tone: 'ok' })
    expect(log.note).toBeNull()
  })

  it('explains a command that started no process, like a bash builtin', () => {
    const builtin = { ...echo, commandLine: 'cd /tmp', calls: [], pid: null }
    const log = toLogRun({ ...builtin, exitCode: null, status: 0 })
    expect(log.lines).toEqual([])
    expect(log.note).toBe(
      'No syscalls traced for cd: no new process started. Bash runs builtins like cd and echo itself.'
    )
  })

  it('marks writes to fd 1 and fd 2 as the two streams', () => {
    const log = toLogRun(echo)
    expect(log.lines[0]).toMatchObject({ stream: 'stdout' })
    expect(log.lines[1]).toMatchObject({ stream: null })
  })
})

describe('streamOf', () => {
  it('reads the stream from the fd a write goes to', () => {
    expect(streamOf({ name: 'write', args: [2, 0x1000, 40] })).toBe('stderr')
    expect(streamOf({ name: 'writev', args: [1, 0x1000, 2] })).toBe('stdout')
  })

  it('leaves other fds and calls alone', () => {
    expect(streamOf({ name: 'write', args: [3, 0x1000, 4] })).toBeNull()
    expect(streamOf({ name: 'read', args: [1, 0x1000, 4] })).toBeNull()
  })
})
