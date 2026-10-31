import { describe, expect, it } from 'vitest'
import { judges, LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'
import { machineFacts } from '#test/machine-facts'

const SHELL = 300
const LOOK = 321
const level = levelUnderTest('prologue-machine-in-section-09-files-doors-wires')

function look(path: string, text: string, { writes = true }: { writes?: boolean } = {}) {
  const log = new LabEventLog().spawn(SHELL, LOOK, './look').readFile(LOOK, path, text)
  if (writes) {
    log.write(LOOK, 1, text)
  }
  return log.exit(LOOK, SHELL).events
}

const motd = look('/etc/motd', 'Welcome to the Machine.\n')
const uptime = look('/proc/uptime', '45.38 6.46\n')
const address = look('/sys/class/net/eth0/address', '00:22:15:76:df:a8\n')

const MOUNTS = (machineFacts().outputs['cat /proc/mounts'] ?? '')
  .split('\n')
  .map((line) => line.split(' '))
  .map(([, point = '', type = '']) => [point, type] as const)

const OBJECTIVE_OF: Readonly<Record<string, string>> = { '9p': 'reads-9p', proc: 'reads-procfs', sysfs: 'reads-sysfs' }

describe('Files, Doors and Wires', () => {
  it('passes with look run on 9p, procfs and sysfs, with zero Taint', () => {
    expect(verdictOf(level, [motd, uptime, address])).toEqual({ passed: true, missing: [], taint: [] })
  })

  it('shows what the starter run gives: the 9p root only', () => {
    expect(metBy(level, motd)).toEqual(['exits-zero', 'reads-9p'])
  })

  it.each(MOUNTS)('knows which filesystem the Machine mounts at %s (%s)', (point, type) => {
    const met = metBy(level, look(`${point === '/' ? '' : point}/a-file`, 'x\n'))
    const expected = OBJECTIVE_OF[type]

    expect(met.filter((id) => id !== 'exits-zero')).toEqual(expected === undefined ? [] : [expected])
  })

  it('takes a relative path as the home folder, on 9p', () => {
    expect(metBy(level, look('notes.txt', 'hi\n'))).toContain('reads-9p')
  })

  it('needs the bytes written to standard output after the read', () => {
    expect(metBy(level, look('/proc/uptime', '45.38 6.46\n', { writes: false }))).toEqual(['exits-zero'])
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
