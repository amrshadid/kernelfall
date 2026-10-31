import { describe, expect, it } from 'vitest'
import { shellSession, stamped } from '#test/index'
import { callsOf, failedCalls, filesOpened, readsOf, samePath } from '#utils/queries/syscall-queries.util'

describe('callsOf', () => {
  it('pairs each call with its own return, even with other tasks running in between', () => {
    const [wait] = callsOf(shellSession(), 2, ['wait4'])

    expect(wait?.enter.seq).toBe(9)
    expect(wait?.exit?.seq).toBe(16)
  })

  it('leaves a call that never returned without one', () => {
    const exec = stamped([
      { type: 'sys_enter', pid: 3, name: 'execve', args: [0, 0, 0], data: '/bin/ls' },
      { type: 'sys_enter', pid: 3, name: 'write', args: [1, 0, 1], data: 'x' },
      { type: 'sys_exit', pid: 3, name: 'write', ret: 1 },
    ])

    expect(callsOf(exec, 3, ['execve'])).toEqual([{ enter: exec[0], exit: undefined }])
  })
})

describe('failedCalls', () => {
  it('lists the calls that failed with their errno', () => {
    expect(
      failedCalls(shellSession(), 2, ['openat', 'write']).map(({ call, errno }) => [call.enter.seq, errno])
    ).toEqual([[4, 2]])
  })
})

describe('filesOpened', () => {
  it('lists each path asked for, its flags and the answer', () => {
    expect(filesOpened(shellSession(), 2)).toEqual([{ path: 'notes.txt', flags: 0o100, ret: -2, seq: 4 }])
  })

  it('reads the flags of open() from its own place', () => {
    const open = stamped([
      { type: 'sys_enter', pid: 2, name: 'open', args: [0, 0o1, 0], data: 'log' },
      { type: 'sys_exit', pid: 2, name: 'open', ret: 3 },
    ])

    expect(filesOpened(open, 2)).toEqual([{ path: 'log', flags: 0o1, ret: 3, seq: 0 }])
  })
})

describe('readsOf', () => {
  // `ls /bin`, then `cat /etc/motd` that stops before the end, in one task for brevity.
  const events = stamped([
    { type: 'sys_enter', pid: 3, name: 'openat', args: [-100, 0, 0o200000], data: '/bin' },
    { type: 'sys_exit', pid: 3, name: 'openat', ret: 3 },
    { type: 'sys_enter', pid: 3, name: 'getdents64', args: [3, 0, 32768] },
    { type: 'sys_exit', pid: 3, name: 'getdents64', ret: 96 },
    { type: 'sys_enter', pid: 3, name: 'getdents64', args: [3, 0, 32768] },
    { type: 'sys_exit', pid: 3, name: 'getdents64', ret: 0 },
    { type: 'sys_enter', pid: 3, name: 'close', args: [3] },
    { type: 'sys_exit', pid: 3, name: 'close', ret: 0 },
    { type: 'sys_enter', pid: 3, name: 'openat', args: [-100, 0, 0], data: '/etc/motd' },
    { type: 'sys_exit', pid: 3, name: 'openat', ret: 3 },
    { type: 'sys_enter', pid: 3, name: 'read', args: [3, 0, 4096] },
    { type: 'sys_exit', pid: 3, name: 'read', ret: 6, data: 'Hello\n' },
  ])

  it('follows a folder through getdents64() to its end, and closing ends its fd', () => {
    expect(readsOf(events, 3, '/bin')).toEqual([{ path: '/bin', fd: 3, reachedEnd: true, text: '' }])
  })

  it('collects what read() returned, and counts no end until a read answers 0', () => {
    expect(readsOf(events, 3, '/etc/motd')).toEqual([{ path: '/etc/motd', fd: 3, reachedEnd: false, text: 'Hello\n' }])
  })

  it('finds nothing for a path never opened, or opened by another task', () => {
    expect(readsOf(events, 3, '/etc')).toEqual([])
    expect(readsOf(events, 4, '/bin')).toEqual([])
  })

  it('matches the path the way the kernel resolves it: `/bin/` is `/bin`', () => {
    const trailing = stamped([
      { type: 'sys_enter', pid: 5, name: 'open', args: [0, 0x98000, 0], data: '/bin/' },
      { type: 'sys_exit', pid: 5, name: 'open', ret: 3 },
      { type: 'sys_enter', pid: 5, name: 'getdents64', args: [3, 0, 2048] },
      { type: 'sys_exit', pid: 5, name: 'getdents64', ret: 0 },
    ])
    expect(readsOf(trailing, 5, '/bin')).toEqual([{ path: '/bin', fd: 3, reachedEnd: true, text: '' }])
    expect(samePath('/bin//.', '/bin')).toBe(true)
    expect(samePath('/', '//')).toBe(true)
    expect(samePath('/bin', '/sbin')).toBe(false)
  })

  it("follows busybox cat's sendfile64 from the file to its end, by its source fd", () => {
    // As the VM's busybox cat runs `cat /etc/motd` on i386: open, sendfile64(1, 3, …) until 0.
    const cat = stamped([
      { type: 'sys_enter', pid: 440, name: 'open', args: [0xbff6cf17, 0x8000, 0], data: '/etc/motd' },
      { type: 'sys_exit', pid: 440, name: 'open', ret: 3 },
      { type: 'sys_enter', pid: 440, name: 'sendfile64', args: [1, 3, 0, 0x1000000] },
      { type: 'sys_exit', pid: 440, name: 'sendfile64', ret: 0x11c },
      { type: 'sys_enter', pid: 440, name: 'sendfile64', args: [1, 3, 0, 0x1000000] },
      { type: 'sys_exit', pid: 440, name: 'sendfile64', ret: 0 },
    ])
    expect(readsOf(cat, 440, '/etc/motd')).toEqual([{ path: '/etc/motd', fd: 3, reachedEnd: true, text: '' }])
  })
})
