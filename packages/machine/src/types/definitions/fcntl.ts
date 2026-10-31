// models include/uapi/asm-generic/fcntl.h (octal, as the header writes them)

export const O_ACCMODE = 0o3
export const O_RDONLY = 0o0
export const O_CREAT = 0o100

// models include/uapi/linux/fcntl.h

/** As a dirfd: resolve relative paths from the current working directory. */
export const AT_FDCWD = -100
