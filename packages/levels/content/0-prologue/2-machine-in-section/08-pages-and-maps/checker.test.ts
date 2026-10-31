import { describe, expect, it } from 'vitest'
import { judges, LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'
import { machineFacts } from '#test/machine-facts'

const SHELL = 474
const WHERE = 492
const level = levelUnderTest('prologue-machine-in-section-08-pages-and-maps')

// A real run of the reference where on the Machine.
const MAPS = [
  '00463000-00464000 r--p 00000000 00:14 6402       /home/you/where',
  '00464000-00465000 r-xp 00001000 00:14 6402       /home/you/where',
  '00465000-00466000 r--p 00002000 00:14 6402       /home/you/where',
  '00466000-00467000 r--p 00002000 00:14 6402       /home/you/where',
  '00467000-00468000 rw-p 00003000 00:14 6402       /home/you/where',
  '0170a000-0170b000 ---p 00000000 00:00 0          [heap]',
  '0170b000-0170c000 rw-p 00000000 00:00 0          [heap]',
  'b7eaa000-b7ead000 r-xp 00000000 00:00 0          [vdso]',
  'b7f52000-b7f53000 rw-p 000a4000 00:14 256        /lib/ld-musl-i386.so.1',
  'bf99b000-bf9bc000 rw-p 00000000 00:00 0          [stack]',
  '',
].join('\n')
const GLOBAL = 'global at 0x467004\n'
const LOCAL = 'local  at 0xbf9bbbb8\n'

const MEMINFO = machineFacts().outputs['head -5 /proc/meminfo'] ?? ''

const where = (printed: string, mapsPath = '/proc/self/maps') =>
  new LabEventLog()
    .spawn(SHELL, WHERE, './where')
    .write(WHERE, 1, printed)
    .readFile(WHERE, mapsPath, MAPS)
    .write(WHERE, 1, MAPS)
    .exit(WHERE, SHELL).events

const reads = (program: string) =>
  new LabEventLog().spawn(SHELL, 320, program).readFile(320, '/proc/meminfo', MEMINFO).exit(320, SHELL).events

describe('Pages and Maps', () => {
  it('passes with meminfo read and the reference where, with zero Taint', () => {
    expect(verdictOf(level, [reads('/usr/bin/free'), where(GLOBAL + LOCAL)])).toEqual({
      passed: true,
      missing: [],
      taint: [],
    })
  })

  it('shows what the starter still misses: a local, on the stack', () => {
    expect(metBy(level, where(GLOBAL))).toEqual(['exits-zero', 'global-in-data'])
  })

  it('finds each address by the region it falls in, not by the order printed', () => {
    const met = metBy(level, where(LOCAL + GLOBAL))

    expect(met).toContain('local-on-stack')
    expect(met).toContain('global-in-data')
  })

  it("doesn't count an address outside every region, in musl's data, or from another process's map", () => {
    expect(metBy(level, where(`${GLOBAL}local  at 0xbf9bc000\n`))).not.toContain('local-on-stack')
    expect(metBy(level, where('global at 0xb7f52010\n'))).not.toContain('global-in-data')
    expect(metBy(level, where(GLOBAL + LOCAL, '/proc/1/maps'))).toEqual(['exits-zero'])
  })

  it('takes its own maps by PID as well as by self', () => {
    expect(metBy(level, where(GLOBAL + LOCAL, `/proc/${WHERE}/maps`))).toContain('local-on-stack')
  })

  it("takes /proc/meminfo read by any program, as the Machine's free reads it", () => {
    expect(metBy(level, reads('/usr/bin/free'))).toEqual(['reads-meminfo'])
    expect(judges(level, reads('/usr/bin/free'))).toBe(true)
  })
})
