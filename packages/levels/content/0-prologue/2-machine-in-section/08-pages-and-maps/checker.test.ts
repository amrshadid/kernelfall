import { describe, expect, it } from 'vitest'
import { judges, LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'

const SHELL = 300
const WHERE = 321
const level = levelUnderTest('prologue-machine-in-section-08-pages-and-maps')

const MAPS = [
  '00400000-00401000 r--p 00000000 fe:02 1402                               /home/you/where',
  '00401000-00405000 r-xp 00001000 fe:02 1402                               /home/you/where',
  '00405000-00406000 rw-p 00005000 fe:02 1402                               /home/you/where',
  '7ffd6b2e1000-7ffd6b302000 rw-p 00000000 00:00 0                          [stack]',
  '',
].join('\n')

const MEMINFO = 'MemTotal:         502340 kB\nMemFree:          421508 kB\nMemAvailable:     449860 kB\n'

/** One run of where: what it prints before its map, then the map it read from `mapsPath`. */
const where = (printed: string, mapsPath = '/proc/self/maps') =>
  new LabEventLog()
    .spawn(SHELL, WHERE, './where')
    .write(WHERE, 1, printed)
    .readFile(WHERE, mapsPath, MAPS)
    .write(WHERE, 1, MAPS)
    .exit(WHERE, SHELL).events

const catMeminfo = new LabEventLog()
  .spawn(SHELL, 320, '/bin/cat')
  .readFile(320, '/proc/meminfo', MEMINFO)
  .exit(320, SHELL).events

describe('Pages and Maps', () => {
  it('passes with meminfo read and the reference where, with zero Taint', () => {
    const verdict = verdictOf(level, [catMeminfo, where('global at 0x405010\nlocal  at 0x7ffd6b300a4c\n')])

    expect(verdict).toEqual({ passed: true, missing: [], taint: [] })
  })

  it('shows what the starter still misses: a local, on the stack', () => {
    expect(metBy(level, where('global at 0x405010\n'))).toEqual(['exits-zero', 'global-in-data'])
  })

  it('finds each address by the region it falls in, not by the order printed', () => {
    const met = metBy(level, where('local  at 0x7ffd6b300a4c\nglobal at 0x405010\n'))

    expect(met).toContain('local-on-stack')
    expect(met).toContain('global-in-data')
  })

  it("doesn't count an address outside every region, or one printed from another process's map", () => {
    expect(metBy(level, where('global at 0x405010\nlocal  at 0x7ffd6b400000\n'))).not.toContain('local-on-stack')
    expect(metBy(level, where('global at 0x405010\nlocal  at 0x7ffd6b300a4c\n', '/proc/1/maps'))).toEqual([
      'exits-zero',
    ])
  })

  it('takes its own maps by PID as well as by self', () => {
    expect(metBy(level, where('global at 0x405010\nlocal  at 0x7ffd6b300a4c\n', `/proc/${WHERE}/maps`))).toContain(
      'local-on-stack'
    )
  })

  it('takes /proc/meminfo read by any program, free as well as cat', () => {
    const free = new LabEventLog()
      .spawn(SHELL, 322, '/bin/free')
      .readFile(322, '/proc/meminfo', MEMINFO)
      .exit(322, SHELL).events

    expect(metBy(level, free)).toEqual(['reads-meminfo'])
    expect(judges(level, free)).toBe(true)
  })
})
