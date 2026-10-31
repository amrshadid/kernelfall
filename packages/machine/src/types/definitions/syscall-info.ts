/** What the explanation card says about one syscall. */
export interface SyscallInfo {
  readonly summary: string
  /** The man page that documents it, e.g. `{ page: "write", section: 2 }` for write(2). */
  readonly man: { readonly page: string; readonly section: number }
  /** The upstream kernel code that handles it. */
  readonly source: { readonly path: string; readonly fn?: string }
}

// The Machine runs Linux 6.18, so source links open that exact version.
export const KERNEL_SOURCE_URL = 'https://elixir.bootlin.com/linux/v6.18/source/'
export const MAN_PAGES_URL = 'https://man7.org/linux/man-pages/'

/** Cards written so far, by syscall name. */
export const SYSCALL_INFO: ReadonlyMap<string, SyscallInfo> = new Map([
  [
    'write',
    {
      summary:
        'Asks the kernel to copy count bytes from a buffer in your memory to the open file fd. ' +
        'Returns how many bytes it wrote, which can be fewer than asked. On failure the kernel ' +
        'returns an error code, and libc turns it into -1 and errno.',
      man: { page: 'write', section: 2 },
      source: { path: 'fs/read_write.c', fn: 'ksys_write()' },
    },
  ],
  [
    'getpid',
    {
      summary:
        "Returns the caller's process ID (PID), the number the kernel knows it by. " +
        'It takes no arguments and always succeeds.',
      man: { page: 'getpid', section: 2 },
      source: { path: 'kernel/sys.c', fn: 'getpid()' },
    },
  ],
  [
    'exit',
    {
      summary:
        'Ends the calling thread. The low 8 bits of status become the exit status the parent ' +
        'sees. It never returns, so strace prints = ?.',
      man: { page: '_exit', section: 2 },
      source: { path: 'kernel/exit.c', fn: 'do_exit()' },
    },
  ],
  [
    'exit_group',
    {
      summary:
        'Ends every thread of the process; this is how a program really exits, and what libc ' +
        'calls when main() returns. It goes through do_group_exit() and never returns.',
      man: { page: 'exit_group', section: 2 },
      source: { path: 'kernel/exit.c', fn: 'do_exit()' },
    },
  ],
])

/** What a trace calls a syscall number the kernel doesn't have: `syscall_` and the number, as strace does. */
export const UNKNOWN_SYSCALL_PREFIX = 'syscall_'

/** Where every syscall's number is tied to its handler. */
export const SYSCALL_TABLE_SOURCE: SyscallInfo['source'] = { path: 'arch/x86/entry/syscalls/syscall_32.tbl' }

/** The card for a syscall number the kernel doesn't have. */
export const UNKNOWN_SYSCALL_INFO: SyscallInfo = {
  summary: "A syscall number that isn't in the kernel's syscall table. The kernel refuses it with ENOSYS.",
  man: { page: 'syscall', section: 2 },
  source: SYSCALL_TABLE_SOURCE,
}
