import { describe, expect, it } from 'vitest'
import { TRACE_PROBE_LIST } from '#vm-image/trace-probes'

const probe = (name: string) => TRACE_PROBE_LIST.find((each) => each.name === name)

describe("the guest's probes", () => {
  it('reads write() and read() at their return, chunk by chunk, a later chunk only for a longer call', () => {
    expect(probe('write_0')?.definition).toMatch(
      /^r:kf\/write_0 ksys_write fd=\$arg1 ret=\$retval:s32 b0=\+u0\(\$arg2\):x32 /
    )
    expect(probe('write_0')?.filter).toBeUndefined()
    expect(probe('write_1')?.definition).toContain('b0=+u256($arg2):x32')
    expect(probe('write_1')?.filter).toBe('ret > 256')
    expect(probe('read_3')?.filter).toBe('ret > 768')
    expect(probe('write_0')?.definition.match(/ b\d+=/g)).toHaveLength(64)
  })

  it("reads writev()'s iovecs through the saved registers, each only when the call had it", () => {
    expect(probe('writev_1_1')?.definition).toBe(
      `r:kf/writev_1_1 __ia32_sys_writev fd=+0($arg1):u32 n=+8($arg1):u32 ret=$retval:s32 l=+u12(+4($arg1)):u32 ${Array.from(
        { length: 64 },
        (_, i) => `b${i}=+u${256 + i * 4}(+u8(+4($arg1))):x32`
      ).join(' ')}`
    )
    expect(probe('writev_1_1')?.filter).toBe('n > 1 && l > 256')
  })

  it("reads what reaches the terminal from n_tty_write's kernel buffer", () => {
    expect(probe('tty_0')?.definition).toMatch(/^p:kf\/tty_0 n_tty_write nr=\$arg4 b0=\+0\(\$arg3\):x32 /)
    expect(probe('tty_7')?.filter).toBe('nr > 1792')
  })

  it("reads paths at return by the argument's register, and execve's at entry", () => {
    expect(probe('path_openat')?.definition).toBe('r:kf/path_openat __ia32_sys_openat p0=+u0(+4($arg1)):ustring')
    expect(probe('path_renameat2')?.definition).toBe(
      'r:kf/path_renameat2 __ia32_sys_renameat2 p0=+u0(+4($arg1)):ustring p1=+u0(+12($arg1)):ustring'
    )
    expect(probe('execve')?.definition).toMatch(/^e:kf\/execve syscalls\/sys_enter_execve path=/)
  })

  it('has no name twice, and nothing that would break the boot script: no | in a definition', () => {
    const names = TRACE_PROBE_LIST.map((each) => each.name)
    expect(new Set(names).size).toBe(names.length)
    expect(TRACE_PROBE_LIST.some((each) => each.definition.includes('|'))).toBe(false)
  })
})
