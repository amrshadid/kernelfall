import type { XrayContent, XraySyscall } from '@kernelfall/levels/types'
import { fillTemplate } from '@kernelfall/levels/utils'

/** A syscall the content doesn't explain yet still shows its raw arguments, entry point and a plain line. */
export function syscallContent(content: XrayContent, name: string, argCount: number): XraySyscall {
  return (
    content.syscalls.get(name) ?? {
      name,
      family: 'generic',
      args: Array.from({ length: argCount }, (_, i) => `arg${i}`),
      pointers: [],
      pathArg: null,
      // The usual 32-bit wrapper name; a few table entries differ (mmap2 is __ia32_sys_mmap_pgoff).
      path: [`__ia32_sys_${name}`],
      sources: [],
      desk: fillTemplate(content.narration.parts['unknown-desk'], { name }),
      returns: null,
    }
  )
}
