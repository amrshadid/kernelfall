import { ENOENT } from '@kernelfall/machine/types'
import { describe, expect, it } from 'vitest'
import { EFI_DIR, INITCALL_LINE, UNKNOWN_PARAMS } from '#content/0-prologue/1-boot-path/04-the-boot-path/checker.ts'
import { LabEventLog, levelUnderTest, metBy, recordedCommands } from '#test/index'

const SHELL = 472
const BUFFER = 0x10000
const level = levelUnderTest('prologue-boot-path-04-the-boot-path')

// Lines the real Machine's dmesg printed after a boot with initcall_debug greeting=hello.
const UNKNOWN =
  '[    0.090320] Unknown kernel command line parameters "greeting=hello", will be passed to user space.\n'
const CALLING = '[    0.305347] calling  con_init+0x0/0x270 @ 0\n'
const RETURNED = '[    2.525332] initcall init_p9+0x0/0x58 [9pnet] returned 0 after 640 usecs\n'

// `dmesg | grep …`: grep may print after dmesg has exited.
const piped = (text: string) =>
  new LabEventLog()
    .spawn(SHELL, 478, '/bin/dmesg')
    .spawn(SHELL, 479, '/bin/grep')
    .exit(478, SHELL)
    .write(479, 1, text)
    .exit(479, SHELL).events

const catted = (text: string) =>
  new LabEventLog().spawn(SHELL, 480, '/bin/cat').write(480, 1, text).exit(480, SHELL).events

const listed = (path: string, ret: number) =>
  new LabEventLog()
    .spawn(SHELL, 482, '/bin/ls')
    .call(482, 'statx', [-100, BUFFER, 0, 0x7ff, BUFFER], ret, { data: path })
    .exit(482, SHELL, { code: ret < 0 ? 1 : 0 }).events

describe('The Boot Path', () => {
  it("knows the lines the Machine's kernel printed in the reference run", () => {
    const shown = recordedCommands('prologue-boot-path-04-the-boot-path', 'solution')
      .flatMap(({ events }) => events)
      .flatMap((event) => (event.type === 'console_write' ? [new TextDecoder().decode(event.bytes)] : []))
      .join('')

    expect(shown).toMatch(UNKNOWN_PARAMS)
    expect(shown).toMatch(INITCALL_LINE)
    expect(shown).toContain(`ls: ${EFI_DIR}: No such file or directory`)
  })

  it("passes a word on to init only when dmesg showed the kernel's line, even through grep", () => {
    expect(metBy(level, piped(UNKNOWN))).toEqual(['passed-to-init'])
    expect(metBy(level, catted(UNKNOWN))).toEqual([])
  })

  it('counts the initcalls from either of their two lines', () => {
    expect(metBy(level, piped(CALLING))).toEqual(['initcalls-logged'])
    expect(metBy(level, piped(RETURNED))).toEqual(['initcalls-logged'])
    expect(metBy(level, piped('[    2.072341] Run /init as init process\n'))).toEqual([])
  })

  it('wants ls to find no /sys/firmware/efi', () => {
    expect(metBy(level, listed(EFI_DIR, -ENOENT))).toEqual(['no-uefi'])
    expect(metBy(level, listed('/sys/firmware', 0))).toEqual([])
  })
})
