import { ERRNO_TABLE } from '#types/definitions/errno-names'
import {
  KERNEL_SOURCE_URL,
  MAN_PAGES_URL,
  SYSCALL_INFO,
  SYSCALL_TABLE_SOURCE,
  type SyscallInfo,
  UNKNOWN_SYSCALL_INFO,
  UNKNOWN_SYSCALL_PREFIX,
} from '#types/definitions/syscall-info'
import type { CallResult } from '#types/definitions/trace'
import { isErrorReturn } from '#utils/strace/strace-format.util'

/** Syscalls documented under the name of the libc wrapper that calls them. */
const MAN_PAGE_OF: ReadonlyMap<string, string> = new Map([['newfstatat', 'fstatat']])

/**
 * The card for a syscall by its trace name. One the kernel has but that has
 * no card of its own yet gets its man page and the syscall table; a number
 * the kernel doesn't have gets the ENOSYS card.
 */
export function syscallInfo(name: string): SyscallInfo {
  const card = SYSCALL_INFO.get(name)
  if (card) {
    return card
  }
  if (name.startsWith(UNKNOWN_SYSCALL_PREFIX)) {
    return UNKNOWN_SYSCALL_INFO
  }
  const page = MAN_PAGE_OF.get(name) ?? name
  return {
    summary: `A request the kernel handles. Its man page, ${page}(2), says what it does and how it can fail.`,
    man: { page, section: 2 },
    source: SYSCALL_TABLE_SOURCE,
  }
}

/** The conventional name of a man page, e.g. "write(2)". */
export function manPageName({ page, section }: SyscallInfo['man']): string {
  return `${page}(${section})`
}

export function manPageUrl({ page, section }: SyscallInfo['man']): string {
  return `${MAN_PAGES_URL}man${section}/${page}.${section}.html`
}

export function kernelSourceUrl(path: string): string {
  return `${KERNEL_SOURCE_URL}${path}`
}

/** One sentence on how this particular call ended, for the explanation card. */
export function describeOutcome(result: CallResult, exitCode: number | null): string {
  switch (result.kind) {
    case 'pending':
      return "Still inside the Kernel: it hasn't returned yet."
    case 'exited':
      return exitCode === null
        ? 'Never returned: the process ended.'
        : `Never returned: the process ended with status ${exitCode}.`
    case 'returned': {
      if (!isErrorReturn(result.ret)) {
        return `Returned ${result.ret} to the program.`
      }
      const errno = -result.ret
      const name = ERRNO_TABLE.get(errno)?.name ?? `errno ${errno}`
      return `Failed: the kernel returned -${name} (${result.ret}). libc hands the program -1 and sets errno to ${name}.`
    }
  }
}
