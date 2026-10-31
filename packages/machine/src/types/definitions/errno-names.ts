// models include/uapi/asm-generic/errno-base.h and errno.h (names) and
// glibc's strerror() text (messages), which is what strace prints.

export interface ErrnoInfo {
  /** The symbolic name, e.g. "EBADF". */
  readonly name: string
  /** The glibc strerror() text, e.g. "Bad file descriptor". */
  readonly message: string
}

/** Linux errno values by number. Covers errno-base.h and the start of errno.h. */
export const ERRNO_TABLE: ReadonlyMap<number, ErrnoInfo> = new Map([
  [1, { name: 'EPERM', message: 'Operation not permitted' }],
  [2, { name: 'ENOENT', message: 'No such file or directory' }],
  [3, { name: 'ESRCH', message: 'No such process' }],
  [4, { name: 'EINTR', message: 'Interrupted system call' }],
  [5, { name: 'EIO', message: 'Input/output error' }],
  [6, { name: 'ENXIO', message: 'No such device or address' }],
  [7, { name: 'E2BIG', message: 'Argument list too long' }],
  [8, { name: 'ENOEXEC', message: 'Exec format error' }],
  [9, { name: 'EBADF', message: 'Bad file descriptor' }],
  [10, { name: 'ECHILD', message: 'No child processes' }],
  [11, { name: 'EAGAIN', message: 'Resource temporarily unavailable' }],
  [12, { name: 'ENOMEM', message: 'Cannot allocate memory' }],
  [13, { name: 'EACCES', message: 'Permission denied' }],
  [14, { name: 'EFAULT', message: 'Bad address' }],
  [15, { name: 'ENOTBLK', message: 'Block device required' }],
  [16, { name: 'EBUSY', message: 'Device or resource busy' }],
  [17, { name: 'EEXIST', message: 'File exists' }],
  [18, { name: 'EXDEV', message: 'Invalid cross-device link' }],
  [19, { name: 'ENODEV', message: 'No such device' }],
  [20, { name: 'ENOTDIR', message: 'Not a directory' }],
  [21, { name: 'EISDIR', message: 'Is a directory' }],
  [22, { name: 'EINVAL', message: 'Invalid argument' }],
  [23, { name: 'ENFILE', message: 'Too many open files in system' }],
  [24, { name: 'EMFILE', message: 'Too many open files' }],
  [25, { name: 'ENOTTY', message: 'Inappropriate ioctl for device' }],
  [26, { name: 'ETXTBSY', message: 'Text file busy' }],
  [27, { name: 'EFBIG', message: 'File too large' }],
  [28, { name: 'ENOSPC', message: 'No space left on device' }],
  [29, { name: 'ESPIPE', message: 'Illegal seek' }],
  [30, { name: 'EROFS', message: 'Read-only file system' }],
  [31, { name: 'EMLINK', message: 'Too many links' }],
  [32, { name: 'EPIPE', message: 'Broken pipe' }],
  [33, { name: 'EDOM', message: 'Numerical argument out of domain' }],
  [34, { name: 'ERANGE', message: 'Numerical result out of range' }],
  [35, { name: 'EDEADLK', message: 'Resource deadlock avoided' }],
  [36, { name: 'ENAMETOOLONG', message: 'File name too long' }],
  [37, { name: 'ENOLCK', message: 'No locks available' }],
  [38, { name: 'ENOSYS', message: 'Function not implemented' }],
  [39, { name: 'ENOTEMPTY', message: 'Directory not empty' }],
  [40, { name: 'ELOOP', message: 'Too many levels of symbolic links' }],
  [95, { name: 'EOPNOTSUPP', message: 'Operation not supported' }],
  // Kernel-internal, so glibc has no text for it; this is the text strace prints.
  [512, { name: 'ERESTARTSYS', message: 'To be restarted if SA_RESTART is set' }],
])
