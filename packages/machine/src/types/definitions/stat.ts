// models include/uapi/linux/stat.h (octal, as the header writes them)

export const S_IFLNK = 0o120000
export const S_IFREG = 0o100000
export const S_IFDIR = 0o040000

/** Permission bits plus setuid, setgid and sticky: what chmod and umask work on. */
export const S_IALLUGO = 0o7777

// models include/uapi/linux/limits.h

/** Longest path, counting its terminating NUL. */
export const PATH_MAX = 4096
/** Longest file name (one path component). */
export const NAME_MAX = 255
