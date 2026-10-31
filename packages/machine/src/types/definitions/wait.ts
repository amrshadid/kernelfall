// models include/uapi/linux/wait.h

export const WNOHANG = 0x00000001

// glibc's name (sys/wait.h) for wait4()'s pid argument meaning "any child".
export const WAIT_ANY = -1
