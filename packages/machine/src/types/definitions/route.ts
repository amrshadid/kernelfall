/** The filesystems the Machine's tree is made of, by the name /proc/mounts gives their type. */
export type FsType = 'ext4' | 'proc' | 'sysfs' | 'devtmpfs' | 'tmpfs' | 'pipefs'

/**
 * Which part of the kernel served a syscall, below the VFS: a filesystem or a
 * driver, and the function the call was handed to, e.g. read → vfs_read() → ext4_file_read_iter().
 */
export type CallRoute =
  | { readonly kind: 'fs'; readonly fs: FsType; readonly fn: string }
  | {
      readonly kind: 'driver'
      /** The driver's name, as its source calls itself: mem (for /dev/null), tty, console. */
      readonly driver: string
      readonly fn: string
    }

/** The file operations a route can name. */
export type RoutedOp = 'open' | 'read' | 'write' | 'llseek' | 'ioctl' | 'readdir' | 'getattr'
