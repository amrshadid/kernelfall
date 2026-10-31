import { describe, expect, it } from 'vitest'
import { describeOutcome, kernelSourceUrl, manPageName, manPageUrl, syscallInfo } from '#utils/trace/syscall-info.util'

describe('syscallInfo', () => {
  it('links each card to the kernel code that handles the call', () => {
    expect(syscallInfo('write').source).toEqual({ path: 'fs/read_write.c', fn: 'ksys_write()' })
    expect(syscallInfo('getpid').source.path).toBe('kernel/sys.c')
    expect(syscallInfo('exit_group').source.path).toBe('kernel/exit.c')
  })

  it('falls back to the unknown-syscall card for a number the kernel lacks', () => {
    expect(manPageName(syscallInfo('syscall_9999').man)).toBe('syscall(2)')
  })

  it('gives a syscall the kernel has but no card describes its own man page, not the ENOSYS card', () => {
    const info = syscallInfo('openat')
    expect(manPageName(info.man)).toBe('openat(2)')
    expect(info.source.path).toBe('arch/x86/entry/syscalls/syscall_32.tbl')
    expect(info.summary).not.toContain('ENOSYS')
    expect(manPageName(syscallInfo('newfstatat').man)).toBe('fstatat(2)')
  })

  it("names exit's man page _exit(2), where Linux documents it", () => {
    expect(manPageName(syscallInfo('exit').man)).toBe('_exit(2)')
  })
})

describe('describeOutcome', () => {
  it('explains success, errors and calls that never return', () => {
    expect(describeOutcome({ kind: 'returned', ret: 13 }, null)).toBe('Returned 13 to the program.')
    expect(describeOutcome({ kind: 'returned', ret: -9 }, null)).toBe(
      'Failed: the kernel returned -EBADF (-9). libc hands the program -1 and sets errno to EBADF.'
    )
    expect(describeOutcome({ kind: 'exited' }, 0)).toBe('Never returned: the process ended with status 0.')
  })
})

describe('links', () => {
  it('points at man7.org and the kernel source browser', () => {
    expect(manPageUrl({ page: 'write', section: 2 })).toBe('https://man7.org/linux/man-pages/man2/write.2.html')
    expect(kernelSourceUrl('fs/read_write.c')).toBe('https://elixir.bootlin.com/linux/v6.18/source/fs/read_write.c')
  })
})
