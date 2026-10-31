// models include/uapi/asm-generic/errno-base.h and errno.h
// Syscalls return these negated, as the kernel does; libc turns them into errno.

export const EPERM = 1
export const ENOENT = 2
export const ESRCH = 3
export const EINTR = 4
export const E2BIG = 7
export const ENOEXEC = 8
export const EBADF = 9
export const ECHILD = 10
export const EAGAIN = 11
export const EACCES = 13
export const EFAULT = 14
export const EBUSY = 16
export const EEXIST = 17
export const EXDEV = 18
export const ENOTDIR = 20
export const EISDIR = 21
export const EINVAL = 22
export const EMFILE = 24
export const ENOTTY = 25
export const ESPIPE = 29
export const EPIPE = 32
export const ERANGE = 34
export const ENAMETOOLONG = 36
export const ENOSYS = 38
export const ENOTEMPTY = 39
export const ELOOP = 40
export const EOPNOTSUPP = 95

// models include/linux/errno.h
// Kernel-internal: a sleeping call interrupted by a signal. User code never sees
// it (the call is restarted or becomes EINTR), but tracers do see it on sys_exit.
export const ERESTARTSYS = 512
