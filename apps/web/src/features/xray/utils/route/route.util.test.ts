import { toXrayCalls } from '@features/xray/utils/calls'
import { xrayContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { bytes, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { routeOf, routesOf } from './route.util'

const SYSFS_OPEN = { kind: 'fs', fs: 'sysfs', fn: 'kernfs_fop_open' } as const
const SYSFS_READ = { kind: 'fs', fs: 'sysfs', fn: 'kernfs_fop_read_iter' } as const
const TTY_WRITE = { kind: 'driver', driver: 'tty', fn: 'tty_write' } as const

// `cat /sys/class/net/eth0/operstate`, as the Machine traces it, after the shell's fork and exec.
const OPERSTATE = stamp([
  { type: 'sys_enter', pid: 33, nr: 59, name: 'execve', args: [0x1000, 0x2000, 0x3000], data: bytes('/bin/cat') },
  { type: 'sched_process_exec', pid: 33, oldPid: 33, filename: '/bin/cat' },
  { type: 'sys_exit', pid: 33, nr: 59, name: 'execve', ret: 0 },
  {
    type: 'sys_enter',
    pid: 33,
    nr: 257,
    name: 'openat',
    args: [-100, 0x4000, 0, 0],
    data: bytes('/sys/class/net/eth0/operstate'),
  },
  { type: 'sys_exit', pid: 33, nr: 257, name: 'openat', ret: 3, route: SYSFS_OPEN },
  { type: 'sys_enter', pid: 33, nr: 0, name: 'read', args: [3, 0x5000, 262144] },
  { type: 'sys_exit', pid: 33, nr: 0, name: 'read', ret: 3, data: bytes('up\n'), route: SYSFS_READ },
  { type: 'sys_enter', pid: 33, nr: 1, name: 'write', args: [1, 0x5000, 3], data: bytes('up\n') },
  { type: 'console_write', bytes: bytes('up\n') },
  { type: 'sys_exit', pid: 33, nr: 1, name: 'write', ret: 3, route: TTY_WRITE },
  { type: 'sys_enter', pid: 33, nr: 231, name: 'exit_group', args: [0] },
  { type: 'sched_process_exit', pid: 33, code: 0 },
])

function view() {
  const run = runOf(OPERSTATE, 'cat /sys/class/net/eth0/operstate')
  return routeOf(run.commandLine, toXrayCalls(run, OPERSTATE, xrayContent()), OPERSTATE)
}

describe('routesOf', () => {
  it("keys each call's route by its sys_enter", () => {
    const routes = routesOf(OPERSTATE)
    expect(routes.get(3)).toEqual(SYSFS_OPEN)
    expect(routes.get(5)).toEqual(SYSFS_READ)
    expect(routes.has(0)).toBe(false)
  })
})

describe('routeOf', () => {
  it('follows one command all the way down: the path, the filesystem or driver, and where it ends', () => {
    const rows = view().rows
    expect(rows.map((row) => [row.program, row.steps.join(' → '), row.part.name])).toEqual([
      ['cat', 'execve → load_elf_binary()', 'Processes and signals'],
      ['cat', 'openat → do_filp_open() → kernfs_fop_open()', 'sysfs'],
      [
        'cat',
        'read → vfs_read() → kernfs_fop_read_iter() → seq_read_iter() → kernfs_seq_show() → sysfs_kf_seq_show() → dev_attr_show() → operstate_show()',
        'sysfs',
      ],
      ['cat', 'write → vfs_write() → tty_write() → file_tty_write() → n_tty_write()', 'tty driver'],
      ['cat', 'exit_group → do_exit()', 'Processes and signals'],
    ])
  })

  it('follows a read through its fd to the file it was opened on', () => {
    const read = view().rows[2]
    expect(read?.file).toBe('/sys/class/net/eth0/operstate')
    expect(read?.result).toBe('= 3')
    expect(read?.end).toBe("eth0's operstate, kept in its struct net_device (net/core/net-sysfs.c)")
    expect(view().rows[3]?.end).toBe('the console: the text appears on the screen')
  })

  it('names where a call no file served lives in the tree', () => {
    expect(view().rows[0]?.part).toEqual({ kind: 'kernel', name: 'Processes and signals', source: 'fs/exec.c' })
  })
})
