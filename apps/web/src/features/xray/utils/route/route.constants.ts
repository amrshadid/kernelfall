import type { RouteBelow, RoutePart } from '@features/xray/types'
import type { FsType, RoutedOp } from '@kernelfall/machine/types'

export const FS_PARTS: Readonly<Record<FsType, RoutePart>> = {
  ext4: { kind: 'fs', name: 'ext4', source: 'fs/ext4/' },
  proc: { kind: 'fs', name: 'procfs', source: 'fs/proc/' },
  sysfs: { kind: 'fs', name: 'sysfs', source: 'fs/sysfs/, fs/kernfs/' },
  devtmpfs: { kind: 'fs', name: 'devtmpfs', source: 'drivers/base/devtmpfs.c, mm/shmem.c' },
  tmpfs: { kind: 'fs', name: 'tmpfs', source: 'mm/shmem.c' },
  pipefs: { kind: 'fs', name: 'pipefs', source: 'fs/pipe.c' },
}

/** By the name the trace gives a driver in its routes. */
export const DRIVER_PARTS: Readonly<Record<string, RoutePart>> = {
  tty: { kind: 'driver', name: 'tty driver', source: 'drivers/tty/tty_io.c, drivers/tty/n_tty.c' },
  mem: { kind: 'driver', name: 'mem driver', source: 'drivers/char/mem.c' },
}

export const BELOW_NONE: RouteBelow = { fns: [], end: null }

/**
 * What each filesystem hands a call on to after the function the trace names, as
 * Linux 6.18 does it; the trace doesn't follow the call past that function.
 */
// models fs/ext4/file.c: ext4_file_read_iter(), mm/filemap.c: filemap_read()
// models fs/kernfs/file.c: kernfs_seq_show(), fs/sysfs/file.c: sysfs_kf_seq_show()
// models fs/proc/inode.c: proc_reg_read_iter(), fs/seq_file.c: seq_read_iter()
export const FS_BELOW: Readonly<Record<FsType, Partial<Record<RoutedOp, RouteBelow>>>> = {
  ext4: {
    read: {
      fns: ['generic_file_read_iter', 'filemap_read'],
      end: 'the page cache; on a miss, the block layer reads the virtio disk',
    },
    write: {
      fns: ['ext4_buffered_write_iter', 'generic_perform_write'],
      end: 'the page cache; the disk gets it later, at writeback',
    },
  },
  proc: {
    read: { fns: ['seq_read_iter'], end: "the kernel's own state, written out as text while you read" },
  },
  sysfs: {
    read: {
      fns: ['seq_read_iter', 'kernfs_seq_show', 'sysfs_kf_seq_show', 'dev_attr_show'],
      end: "a device's attribute: its _show() function writes the text",
    },
  },
  devtmpfs: {},
  tmpfs: { read: { fns: [], end: 'memory: tmpfs keeps its files in RAM' } },
  pipefs: {
    read: { fns: [], end: "the pipe's buffer in the kernel" },
    write: { fns: [], end: "the pipe's buffer in the kernel" },
  },
}

// models drivers/tty/tty_io.c: tty_write(), drivers/tty/n_tty.c: n_tty_write(), drivers/char/mem.c
export const DRIVER_BELOW: Readonly<Record<string, Partial<Record<RoutedOp, RouteBelow>>>> = {
  tty: {
    write: { fns: ['file_tty_write', 'n_tty_write'], end: 'the console: the text appears on the screen' },
    read: { fns: ['n_tty_read'], end: 'what you typed, a line at a time' },
  },
  mem: {
    read: { fns: [], end: 'nothing: /dev/null answers end of file at once' },
    write: { fns: [], end: 'nowhere: /dev/null throws the bytes away' },
  },
}

/** A /sys/class/net/<device>/<attribute> file, shown by net/core/net-sysfs.c's <attribute>_show(). */
export const NET_SYSFS_ATTRIBUTE = /^\/sys\/class\/net\/([^/]+)\/([a-z_]+)$/

/** The syscall each routed operation comes from. */
export const OP_OF_SYSCALL: Readonly<Record<string, RoutedOp>> = {
  read: 'read',
  pread64: 'read',
  readv: 'read',
  write: 'write',
  pwrite64: 'write',
  writev: 'write',
  openat: 'open',
  open: 'open',
  lseek: 'llseek',
  _llseek: 'llseek',
  ioctl: 'ioctl',
  getdents64: 'readdir',
  fstatat64: 'getattr',
  stat64: 'getattr',
  lstat64: 'getattr',
  fstat64: 'getattr',
  fstat: 'getattr',
  statx: 'getattr',
}

/** Syscalls that open a file and return its fd. */
export const OPENS = new Set(['open', 'openat'])

/** Syscalls whose first argument is the fd they work on. */
export const FD_CALLS = new Set([
  'read',
  'pread64',
  'readv',
  'write',
  'pwrite64',
  'writev',
  'lseek',
  '_llseek',
  'ioctl',
  'getdents64',
  'fstat',
  'fstat64',
])
