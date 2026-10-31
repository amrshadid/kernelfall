import { describe, expect, it } from 'vitest'
import { judges, LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'

const SHELL = 300
const LOOK = 321
const level = levelUnderTest('prologue-machine-in-section-09-files-doors-wires')

/** One run of look on `path`: it reads `text` and writes it out, unless told not to. */
function look(path: string, text: string, { writes = true }: { writes?: boolean } = {}) {
  const log = new LabEventLog().spawn(SHELL, LOOK, './look').readFile(LOOK, path, text)
  if (writes) {
    log.write(LOOK, 1, text)
  }
  return log.exit(LOOK, SHELL).events
}

const motd = look('/etc/motd', 'Welcome to the Machine.\n')
const uptime = look('/proc/uptime', '812.47 790.10\n')
const address = look('/sys/class/net/eth0/address', '52:54:00:12:34:56\n')

describe('Files, Doors and Wires', () => {
  it('passes with look run on ext4, procfs and sysfs, with zero Taint', () => {
    expect(verdictOf(level, [motd, uptime, address])).toEqual({ passed: true, missing: [], taint: [] })
  })

  it('shows what the starter run gives: the disk only', () => {
    expect(metBy(level, motd)).toEqual(['exits-zero', 'reads-ext4'])
  })

  it('tells the filesystems apart by where the path is mounted', () => {
    expect(metBy(level, uptime)).toContain('reads-procfs')
    expect(metBy(level, address)).toContain('reads-sysfs')
    expect(metBy(level, look('notes.txt', 'hi\n'))).toContain('reads-ext4')
    expect(metBy(level, look('/dev/null', 'x'))).toEqual(['exits-zero'])
  })

  it('needs the bytes written to standard output after the read', () => {
    expect(metBy(level, look('/proc/uptime', '812.47 790.10\n', { writes: false }))).toEqual(['exits-zero'])
  })

  it('needs at least one byte read', () => {
    expect(metBy(level, look('/proc/uptime', ''))).not.toContain('reads-procfs')
  })

  it('judges look, not cat', () => {
    const cat = new LabEventLog()
      .spawn(SHELL, 322, '/bin/cat')
      .readFile(322, '/proc/uptime', '1.0 1.0\n')
      .exit(322, SHELL).events

    expect(judges(level, cat)).toBe(false)
    expect(metBy(level, cat)).toEqual([])
  })
})
