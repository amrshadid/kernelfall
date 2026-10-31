import type { TraceCall, TraceRun } from '@kernelfall/machine/types'
import { describe, expect, it } from 'vitest'
import { partsOfCall, sectionOf } from './section.util'

const encode = (text: string) => new TextEncoder().encode(text)
const returned = (ret: number) => ({ kind: 'returned' as const, ret })

function call(id: number, name: string, ret: number, path?: string): TraceCall {
  return { id, pid: 2, nr: 0, name, args: [], ...(path ? { data: encode(path) } : {}), result: returned(ret) }
}

const CAT_SYS: TraceRun = {
  id: 1,
  commandLine: 'cat /sys/class/net/eth0/operstate',
  status: 0,
  pid: 2,
  exitCode: 0,
  calls: [
    call(1, 'execve', 0, '/bin/cat'),
    call(2, 'openat', 3, '/sys/class/net/eth0/operstate'),
    call(3, 'read', 3),
    call(4, 'write', 3),
    { id: 5, pid: 2, nr: 231, name: 'exit_group', args: [0], result: { kind: 'exited' } },
  ],
}

describe('partsOfCall', () => {
  it('sends every call through the syscall interface, then where its code lives', () => {
    expect(partsOfCall(call(1, 'read', 4))).toEqual(['syscalls', 'vfs'])
    expect(partsOfCall(call(1, 'clone', 3))).toEqual(['syscalls', 'processes', 'memory'])
  })

  it('follows a path to a driver, or to the kernel log', () => {
    expect(partsOfCall(call(1, 'openat', 3, '/dev/null'))).toContain('drivers')
    expect(partsOfCall(call(1, 'openat', 3, '/dev/kmsg'))).toContain('logging')
    expect(partsOfCall(call(1, 'openat', 3, '/etc/motd'))).toEqual(['syscalls', 'vfs'])
  })

  it('lights security when a permission check said no', () => {
    expect(partsOfCall(call(1, 'openat', -13, '/root/secret'))).toContain('security')
    expect(partsOfCall(call(1, 'kill', -1))).toContain('security')
    expect(partsOfCall(call(1, 'openat', -2, '/nope'))).not.toContain('security')
  })

  it("knows the Survey's file and permission calls", () => {
    for (const name of ['mkdir', 'rmdir', 'unlink', 'renameat2']) {
      expect(partsOfCall(call(1, name, 0))).toEqual(['syscalls', 'vfs'])
    }
    expect(partsOfCall(call(1, 'fchmodat', 0))).toEqual(['syscalls', 'vfs', 'security'])
    expect(partsOfCall(call(1, 'clock_nanosleep', 0))).toEqual(['syscalls', 'scheduler'])
  })

  it('follows a call to the filesystem or driver its route names', () => {
    expect(partsOfCall(call(1, 'read', 4), { kind: 'fs', fs: 'ext4', fn: 'ext4_file_read_iter' })).toEqual([
      'syscalls',
      'vfs',
      'disk',
    ])
    expect(partsOfCall(call(1, 'write', 3), { kind: 'driver', driver: 'tty', fn: 'tty_write' })).toContain('drivers')
    expect(partsOfCall(call(1, 'read', 3), { kind: 'fs', fs: 'proc', fn: 'proc_reg_read_iter' })).toEqual([
      'syscalls',
      'vfs',
    ])
  })

  it('knows an unlisted syscall only crossed the interface', () => {
    expect(partsOfCall(call(1, 'uname', 0))).toEqual(['syscalls'])
  })
})

describe('sectionOf', () => {
  const view = sectionOf(CAT_SYS)
  const part = (id: string) => view.floors.flatMap((floor) => floor.parts).find((p) => p.id === id)

  it('draws three floors, programs above the kernel and the board below', () => {
    expect(view.floors.map((floor) => floor.floor)).toEqual(['userland', 'kernel', 'hardware'])
    expect(view.total).toBe(5)
  })

  it('counts the calls through each part and names them', () => {
    expect(part('syscalls')).toMatchObject({ calls: 5 })
    expect(part('vfs')).toMatchObject({ calls: 4, names: ['execve', 'openat', 'read', 'write'] })
    expect(part('drivers')).toMatchObject({ calls: 1, names: ['openat'] })
    expect(part('networking')).toMatchObject({ calls: 0, names: [] })
  })

  it("lights the write's driver once the trace says the tty served it", () => {
    const routed = sectionOf(CAT_SYS, new Map([[4, { kind: 'driver', driver: 'tty', fn: 'tty_write' } as const]]))
    const drivers = routed.floors.flatMap((floor) => floor.parts).find((p) => p.id === 'drivers')
    expect(drivers).toMatchObject({ calls: 2, names: ['openat', 'write'] })
  })
})
