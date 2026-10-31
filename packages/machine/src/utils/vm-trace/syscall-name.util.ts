import { SYSCALL_NUMBERS, TRACEPOINT_SYSCALLS } from '#types/definitions/syscall-table'

/** The syscall's own name, as strace and the man pages give it: the tracepoint `newuname` is uname(2). */
export const syscallName = (tracepoint: string): string => TRACEPOINT_SYSCALLS[tracepoint] ?? tracepoint

/** Its i386 number, through its own name; -1 for none. */
export const syscallNumber = (tracepoint: string): number => SYSCALL_NUMBERS[syscallName(tracepoint)] ?? -1
