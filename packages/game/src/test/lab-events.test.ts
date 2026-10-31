import { describe, expect, it } from 'vitest'
import { stamped, syscallNr } from '#test/lab-events'

describe('stamped', () => {
  it("numbers a syscall by its name, as the VM's i386 kernel does", () => {
    const [enter] = stamped([{ type: 'sys_enter', pid: 2, name: 'write', args: [1, 0, 1], data: 'x' }])
    expect(enter).toMatchObject({ nr: 4, seq: 0, data: Uint8Array.of(0x78) })
  })

  it('fails loudly on a syscall the kernel has no number for', () => {
    expect(() => syscallNr('wirte')).toThrow('no syscall named wirte')
  })
})
