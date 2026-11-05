import { type CallRoute, FS_TYPES, type FsType } from '#types/definitions/route'
import { TRACE_PROBES } from '#types/definitions/vm-trace'
import { syscallName } from '#utils/vm-trace/syscall-name.util'
import { fieldNumber } from '#utils/vm-trace/trace-data.util'

/** The VFS hook (`route_<hook>`) each syscall goes through, by its own name. */
const HOOK_OF_SYSCALL: Readonly<Record<string, string>> = {
  read: 'read',
  pread64: 'read',
  readv: 'readv',
  preadv: 'readv',
  preadv2: 'readv',
  write: 'write',
  pwrite64: 'write',
  writev: 'writev',
  pwritev: 'writev',
  pwritev2: 'writev',
  open: 'open',
  openat: 'open',
  openat2: 'open',
  creat: 'open',
  getdents: 'readdir',
  getdents64: 'readdir',
  readdir: 'readdir',
  oldstat: 'getattr',
  oldlstat: 'getattr',
  oldfstat: 'getattr',
  stat: 'getattr',
  lstat: 'getattr',
  fstat: 'getattr',
  stat64: 'getattr',
  lstat64: 'getattr',
  fstat64: 'getattr',
  fstatat64: 'getattr',
  statx: 'getattr',
  lseek: 'llseek',
  _llseek: 'llseek',
  sendfile: 'splice',
  sendfile64: 'splice',
  splice: 'splice',
}

// include/uapi/linux/stat.h
const S_IFMT = 0o170000
const S_IFIFO = 0o10000
const S_IFCHR = 0o20000
// fs/stat.c: vfs_getattr_nosec() fills the stat itself when the inode has no ->getattr.
const GETATTR_FALLBACK = 'generic_fillattr'
// fs/char_dev.c: every character device's inode opens with chrdev_open(), which calls the driver's open.
const CHRDEV_OPEN = 'chrdev_open'
const SYMBOL = /^([A-Za-z_][\w.]*)\+0x[0-9a-f]+\/0x[0-9a-f]+$/

/**
 * Character devices' file_operations, by the driver whose source defines them. memory_open() gives
 * /dev/null and its neighbours theirs by minor (drivers/char/mem.c).
 */
const DRIVER_OF_FOPS: Readonly<Record<string, string>> = {
  tty_fops: 'tty',
  hung_up_tty_fops: 'tty',
  console_fops: 'tty',
  ptmx_fops: 'tty',
  null_fops: 'mem',
  zero_fops: 'mem',
  full_fops: 'mem',
  mem_fops: 'mem',
  port_fops: 'mem',
  memory_fops: 'mem',
  random_fops: 'random',
  urandom_fops: 'random',
}
const FOPS_SUFFIX = /_(?:fops|file_operations|fileops)$/

/** A :symbol field → the function's name: `v9fs_file_read_iter+0x0/0x30` (its ` [9p]` is a field apart); NULL → null. */
export function symbolName(field: string | undefined): string | null {
  return field?.match(SYMBOL)?.[1] ?? null
}

/** The hook a route probe sits on (`route_open` → open), or null for any other probe. */
export function routeHookOf(probe: string): string | null {
  const prefix = `${TRACE_PROBES.route}_`
  return probe.startsWith(prefix) ? probe.slice(prefix.length) : null
}

const isFsType = (name: string): name is FsType => (FS_TYPES as readonly string[]).includes(name)

/**
 * The part of the kernel that served `syscall`, from a route probe that fired while it ran; undefined
 * for a hook the syscall doesn't go through (kernel-internal work, like execve opening the program).
 */
export function callRoute(
  syscall: string,
  probe: string,
  fields: Readonly<Record<string, string>>
): CallRoute | undefined {
  const hook = routeHookOf(probe)
  if (hook === null || HOOK_OF_SYSCALL[syscallName(syscall)] !== hook) {
    return undefined
  }
  const handler = symbolName(fields.h0) ?? symbolName(fields.h1)
  const type = fieldNumber(fields.m) & S_IFMT
  const fops = symbolName(fields.fop)
  if (type === S_IFCHR && fops !== null) {
    const fn = handler ?? (hook === 'open' ? CHRDEV_OPEN : null)
    const driver = DRIVER_OF_FOPS[fops] ?? fops.replace(FOPS_SUFFIX, '')
    return fn === null ? undefined : { kind: 'driver', driver, fn }
  }
  // A named pipe lives in its filesystem, but its data goes through fs/pipe.c's buffer.
  const fs = type === S_IFIFO && hook !== 'getattr' ? 'pipefs' : (fields.fs ?? '')
  const fn = handler ?? (hook === 'getattr' ? GETATTR_FALLBACK : null)
  return isFsType(fs) && fn !== null ? { kind: 'fs', fs, fn } : undefined
}
