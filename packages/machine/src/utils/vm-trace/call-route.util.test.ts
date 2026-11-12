import { describe, expect, it } from 'vitest'
import { callRoute, symbolName } from '#utils/vm-trace/call-route.util'
import { parseTraceLine } from '#utils/vm-trace/trace-line.util'

// trace_pipe lines from the Machine (linux-virt 6.18): the route probes as the guest defines them.
const LINES = {
  ext4Read:
    '            head-484     [000] .....     8.574418: route_read: (vfs_read+0x0/0x3d0) fs="ext4" m=33188 h0=0x0 h1=ext4_file_read_iter+0x0/0x180 [ext4] fop=ext4_file_operations+0x0/0xa0 [ext4]',
  procOpen:
    '          umount-490     [000] .....     8.726270: route_open: (vfs_open+0x1f/0xd0 <- do_dentry_open) fs="proc" m=33060 h0=mounts_open+0x0/0x20 fop=proc_mounts_operations+0x0/0x88',
  nineReadv:
    '            head-484     [000] .....     8.601944: route_read: (vfs_read+0x0/0x3d0) fs="9p" m=33188 h0=0x0 h1=v9fs_file_read_iter+0x0/0x30 [9p] fop=v9fs_file_operations_dotl+0x0/0xa0 [9p]',
  nullWritev:
    '            head-484     [000] .....     8.575899: route_writev: (vfs_writev+0x0/0x2f0) fs="devtmpfs" m=8630 h0=write_iter_null+0x0/0x20 h1=write_null+0x0/0x10 fop=null_fops+0x0/0xa0',
  zeroOpen:
    '            head-487     [000] .....     8.654139: route_open: (vfs_open+0x1f/0xd0 <- do_dentry_open) fs="devtmpfs" m=8630 h0=0x0 fop=zero_fops+0x0/0xa0',
  zeroRead:
    '            head-487     [000] .....     8.654288: route_read: (vfs_read+0x0/0x3d0) fs="devtmpfs" m=8630 h0=read_zero+0x0/0xb0 h1=read_iter_zero+0x0/0xd0 fop=zero_fops+0x0/0xa0',
  devptsStat:
    '            stat-489     [000] .....     8.697769: route_getattr: (vfs_getattr_nosec+0x0/0xf0) fs="devpts" m=16877 h0=0x0',
  nullStat:
    '           mount-478     [000] ..Zff     8.478217: route_getattr: (vfs_getattr_nosec+0x0/0xf0) fs="devtmpfs" m=24960 h0=shmem_getattr+0x0/0x90',
  ext4Readdir:
    '              ls-483     [000] .....     8.544621: route_readdir: (iterate_dir+0x0/0x210) fs="ext4" m=16877 h0=ext4_readdir+0x0/0xc20 [ext4]',
  nineSplice:
    '             cat-488     [000] ..Zff     8.676457: route_splice: (do_splice_read+0x0/0xc0) fs="9p" m=33188 h0=v9fs_file_splice_read+0x0/0x40 [9p] fop=v9fs_file_operations_dotl+0x0/0xa0 [9p]',
  ttyOpen:
    '              sh-482     [000] .....     8.642847: route_open: (vfs_open+0x1f/0xd0 <- do_dentry_open) fs="devtmpfs" m=8576 h0=tty_open+0x0/0x630 fop=tty_fops+0x0/0x88',
  fifoRead:
    '            head-486     [000] .....     8.728828: route_read: (vfs_read+0x0/0x3d0) fs="tmpfs" m=4516 h0=0x0 h1=fifo_pipe_read+0x0/0x40 fop=pipefifo_fops+0x0/0xa0',
  debugfsRead:
    '            head-479     [000] .....     8.599908: route_read: (vfs_read+0x0/0x3d0) fs="debugfs" m=33060 h0=full_proxy_read+0x0/0x70 h1=0x0 fop=debugfs_full_proxy_file_operations+0x0/0xa0',
}

function routeOf(syscall: string, line: string) {
  const record = parseTraceLine(line)
  if (record?.kind !== 'probe') {
    throw new Error(`not a probe line: ${line}`)
  }
  return callRoute(syscall, record.probe, record.fields)
}

describe('symbolName', () => {
  it('takes the function out of a :symbol field, and none from NULL', () => {
    expect(symbolName('ext4_file_read_iter+0x0/0x180')).toBe('ext4_file_read_iter')
    expect(symbolName('0x0')).toBeNull()
    expect(symbolName(undefined)).toBeNull()
  })
})

describe('callRoute', () => {
  it('names the filesystem and the handler the VFS called: ->read when set, ->read_iter otherwise', () => {
    expect(routeOf('read', LINES.ext4Read)).toEqual({ kind: 'fs', fs: 'ext4', fn: 'ext4_file_read_iter' })
    expect(routeOf('pread64', LINES.nineReadv)).toEqual({ kind: 'fs', fs: '9p', fn: 'v9fs_file_read_iter' })
    expect(routeOf('openat', LINES.procOpen)).toEqual({ kind: 'fs', fs: 'proc', fn: 'mounts_open' })
    expect(routeOf('getdents64', LINES.ext4Readdir)).toEqual({ kind: 'fs', fs: 'ext4', fn: 'ext4_readdir' })
    expect(routeOf('sendfile64', LINES.nineSplice)).toEqual({ kind: 'fs', fs: '9p', fn: 'v9fs_file_splice_read' })
  })

  it("names a character device's driver by its file_operations, and the handler it gave the call", () => {
    expect(routeOf('writev', LINES.nullWritev)).toEqual({ kind: 'driver', driver: 'mem', fn: 'write_iter_null' })
    expect(routeOf('read', LINES.zeroRead)).toEqual({ kind: 'driver', driver: 'mem', fn: 'read_zero' })
    expect(routeOf('open', LINES.ttyOpen)).toEqual({ kind: 'driver', driver: 'tty', fn: 'tty_open' })
  })

  it('opens a device with no open of its own through chrdev_open()', () => {
    expect(routeOf('openat', LINES.zeroOpen)).toEqual({ kind: 'driver', driver: 'mem', fn: 'chrdev_open' })
  })

  it("answers a device's stat from the filesystem it lives in, generic_fillattr() when it has no ->getattr", () => {
    expect(routeOf('statx', LINES.nullStat)).toEqual({ kind: 'fs', fs: 'devtmpfs', fn: 'shmem_getattr' })
    expect(routeOf('fstatat64', LINES.devptsStat)).toEqual({ kind: 'fs', fs: 'devpts', fn: 'generic_fillattr' })
  })

  it("sends a named pipe's data through pipefs", () => {
    expect(routeOf('read', LINES.fifoRead)).toEqual({ kind: 'fs', fs: 'pipefs', fn: 'fifo_pipe_read' })
  })

  it('leaves out a hook the syscall does not go through, and a filesystem the Machine has no part for', () => {
    expect(routeOf('execve', LINES.procOpen)).toBeUndefined()
    expect(routeOf('write', LINES.ext4Read)).toBeUndefined()
    expect(routeOf('read', LINES.debugfsRead)).toBeUndefined()
  })
})
