import { describe, expect, it } from 'vitest'
import { PATH_DIRS } from '#content/0-prologue/1-boot-path/03-speak-to-shell/checker.ts'
import { LabEventLog, levelUnderTest, metBy } from '#test/index'
import { machineFacts } from '#test/machine-facts'

const SHELL = 300
const BUFFER = 0x10000
const O_DIRECTORY_CLOEXEC = 0x98000
const level = levelUnderTest('prologue-boot-path-03-speak-to-shell')

// The shell reads a folder to the end, as Tab and a glob both do; only a glob closes it in the events.
const shellReads = (dir: string, { closes }: { readonly closes: boolean }) => {
  const log = new LabEventLog()
    .call(SHELL, 'open', [BUFFER, O_DIRECTORY_CLOEXEC, 0], 3, { data: `${dir}/` })
    .call(SHELL, 'getdents64', [3, BUFFER, 2048], 1472)
    .call(SHELL, 'getdents64', [3, BUFFER, 2048], 0)
  return (closes ? log.call(SHELL, 'close', [3], 0) : log).spawn(SHELL, 321, '/bin/cat').exit(321, SHELL).events
}

describe('Speak to the Shell', () => {
  it("completes commands in the Machine's own PATH", () => {
    expect(PATH_DIRS.join(':')).toBe(machineFacts().outputs['echo "$PATH"'])
  })

  it('counts a folder read before Enter as Tab', () => {
    expect(metBy(level, shellReads('/etc', { closes: false }))).toContain('completes-a-file')
    expect(metBy(level, shellReads('/usr/bin', { closes: false }))).toContain('completes-a-command')
  })

  it('rejects a glob, which reads the folder after Enter and closes it', () => {
    expect(metBy(level, shellReads('/etc', { closes: true }))).not.toContain('completes-a-file')
    expect(metBy(level, shellReads('/usr/bin', { closes: true }))).not.toContain('completes-a-command')
  })
})
