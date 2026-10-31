/**
 * What musl's loader and BusyBox do before main's real work: the thread pointer, the
 * heap, RELRO, and BusyBox dropping to the caller's uid and gid with signals masked.
 */
export const START_UP_CALLS: ReadonlySet<string> = new Set([
  'set_thread_area',
  'set_tid_address',
  'brk',
  'mmap2',
  'mmap',
  'mprotect',
  'munmap',
  'getuid32',
  'getgid32',
  'geteuid32',
  'getegid32',
  'setuid32',
  'setgid32',
  'getuid',
  'getgid',
  'geteuid',
  'getegid',
  'setuid',
  'setgid',
  'rt_sigprocmask',
])

/** bash's job control around a command: signal masks and handlers, process groups, the terminal, its sync pipe. */
export const SHELL_BOOKKEEPING_CALLS: ReadonlySet<string> = new Set([
  'rt_sigaction',
  'rt_sigprocmask',
  'sigaction',
  'sigprocmask',
  'sigreturn',
  'rt_sigreturn',
  'setpgid',
  'getpgrp',
  'getpid',
  'ioctl',
  'close',
  // musl's fork() sets it in the child, before bash's own code runs.
  'set_tid_address',
])

/** How bash checks each PATH folder for the command (findcmd.c). */
export const PATH_LOOKUP_CALLS: ReadonlySet<string> = new Set([
  'statx',
  'stat64',
  'fstatat64',
  'access',
  'faccessat',
  'faccessat2',
])

/** The player's PATH on the Machine (Alpine's /etc/profile), checked against the Machine's facts in tests. */
export const MACHINE_PATH = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

/** Folders a PATH search looks in; "." is bash comparing the current folder with them. */
export const PATH_FOLDERS: ReadonlySet<string> = new Set([...MACHINE_PATH.split(':'), '.'])

/** ncurses' own name for its database folders: ~/.terminfo, /etc/terminfo, /usr/share/terminfo… */
export const TERMINFO_FOLDERS: ReadonlySet<string> = new Set(['terminfo', '.terminfo'])

/** ncurses opens the terminfo entry as the real user: it swaps the filesystem uid and gid around the open. */
export const TERMINFO_CREDENTIAL_CALLS: ReadonlySet<string> = new Set([
  'getuid32',
  'geteuid32',
  'getgid32',
  'getegid32',
  'setfsuid32',
  'setfsgid32',
  'getuid',
  'geteuid',
  'getgid',
  'getegid',
  'setfsuid',
  'setfsgid',
])

/** After the entry is open: its size, its bytes. */
export const TERMINFO_READ_CALLS: ReadonlySet<string> = new Set(['statx', 'fstat64', 'fstat', 'read', 'readv', 'close'])

export const FORK_CALLS: ReadonlySet<string> = new Set(['fork', 'vfork', 'clone', 'clone3'])

/** bash's sync pipe: the child reads one byte until the parent has set its process group (jobs.c). */
export const SYNC_READ_COUNT = 1

/** Fewest calls a fold takes; a lone call stays a row. */
export const MIN_FOLD = 2

/** Fewest repeats of one call, or of a short cycle, that fold into "× n". */
export const MIN_REPEAT = 5
export const MIN_CYCLE_REPEAT = 3
export const MAX_CYCLE = 3

/** Rows a stretch of one program may take before its own work folds into one summary row. */
export const MAX_SEGMENT_ROWS = 30

/** Call names a summary row lists, most frequent first. */
export const SUMMARY_NAMES = 3

/** Rows an open fold draws; the strace sequence has every call. */
export const FOLD_ROW_LIMIT = 100

/** What each objective check judges, as the calls a player watches for it. */
export const CHECK_CALLS: Readonly<Record<string, readonly string[]>> = {
  wrote: ['write', 'writev'],
  terminal: ['write', 'writev'],
  'exit-status': ['execve', 'exit_group', 'exit'],
  ran: ['execve'],
  'read-to-end': ['open', 'openat', 'read', 'getdents64'],
  'no-zombies-after': ['fork', 'vfork', 'clone', 'wait4', 'waitid'],
  'unreaped-children': ['fork', 'vfork', 'clone', 'wait4', 'waitid'],
}
