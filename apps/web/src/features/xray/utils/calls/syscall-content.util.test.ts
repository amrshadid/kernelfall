import { xrayContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { syscallContent } from './syscall-content.util'

describe('syscallContent', () => {
  it('returns what the content says about a syscall it explains', () => {
    expect(syscallContent(xrayContent(), 'write', 3)).toMatchObject({ family: 'write', args: ['fd', 'buf', 'count'] })
  })

  // io_uring is far past what any level teaches, so the content never explains it.
  it('gives a syscall the content does not explain its raw arguments and entry point', () => {
    expect(syscallContent(xrayContent(), 'io_uring_setup', 2)).toEqual({
      name: 'io_uring_setup',
      family: 'generic',
      args: ['arg0', 'arg1'],
      pointers: [],
      pathArg: null,
      path: ['__ia32_sys_io_uring_setup'],
      sources: [],
      desk: "Runs the kernel's io_uring_setup",
      returns: null,
    })
  })
})
