/**
 * The filesystems a call on the Machine can reach, by their struct file_system_type name (as
 * /proc/mounts and /proc/filesystems give it): what it mounts, and the kernel's internal ones.
 */
export const FS_TYPES = [
  '9p',
  'ext4',
  'proc',
  'sysfs',
  'devtmpfs',
  'devpts',
  'tmpfs',
  'tracefs',
  'pipefs',
  'sockfs',
  'anon_inodefs',
] as const
export type FsType = (typeof FS_TYPES)[number]

/**
 * Which part of the kernel served a syscall, below the VFS: a filesystem or a
 * driver, and the function the call was handed to, e.g. read → vfs_read() → ext4_file_read_iter().
 */
export type CallRoute =
  | { readonly kind: 'fs'; readonly fs: FsType; readonly fn: string }
  | {
      readonly kind: 'driver'
      /** The driver's name, as its source calls itself: mem (for /dev/null), tty, random. */
      readonly driver: string
      readonly fn: string
    }

/** The file operations a route can name. */
export type RoutedOp = 'open' | 'read' | 'write' | 'llseek' | 'ioctl' | 'readdir' | 'getattr'
