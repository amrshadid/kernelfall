import { SIGSEGV } from '@kernelfall/machine/types'
import { describe, expect, it } from 'vitest'
import { judges, LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'

const SHELL = 300
const level = levelUnderTest('prologue-machine-in-section-05-kernel-up-close')

const poke = (signal?: number) =>
  new LabEventLog().spawn(SHELL, 321, './poke').exit(321, SHELL, signal === undefined ? {} : { signal }).events

const myuname = (printed: string) =>
  new LabEventLog()
    .spawn(SHELL, 322, './myuname')
    .call(322, 'uname', [0x10000], 0, { out: 'Linux' })
    .write(322, 1, printed)
    .exit(322, SHELL).events

const unameCommand = new LabEventLog()
  .spawn(SHELL, 323, '/bin/uname')
  .call(323, 'uname', [0x10000], 0, { out: 'Linux' })
  .write(323, 1, 'Linux 6.18.59-0-virt i686\n')
  .exit(323, SHELL).events

describe('The Kernel Up Close', () => {
  it('passes with poke, the reference myuname and uname -srm, with zero Taint', () => {
    const verdict = verdictOf(level, [poke(SIGSEGV), myuname('Linux 6.18.59-0-virt i686\n'), unameCommand])

    expect(verdict).toEqual({ passed: true, missing: [], taint: [] })
  })

  it('shows what the starter still misses: the CPU type', () => {
    expect(metBy(level, myuname('Linux 6.18.59-0-virt\n'))).toEqual(['asks-uname', 'exits-zero'])
  })

  it('takes the three words in any order, but on one line', () => {
    expect(metBy(level, myuname('i686 Linux 6.18.59-0-virt\n'))).toContain('prints-machine')
    expect(metBy(level, myuname('Linux\n6.18.59-0-virt\ni686\n'))).not.toContain('prints-machine')
  })

  it('counts poke only when the kernel killed it with SIGSEGV', () => {
    expect(metBy(level, poke(SIGSEGV))).toEqual(['poke-segfaults'])
    expect(metBy(level, poke())).toEqual([])
  })

  it('judges the uname command by what it printed', () => {
    expect(metBy(level, unameCommand)).toEqual(['compares-uname'])
  })

  it('judges poke, myuname and uname, not other commands', () => {
    const ls = new LabEventLog().spawn(SHELL, 324, '/bin/ls').exit(324, SHELL).events

    expect(judges(level, poke(SIGSEGV))).toBe(true)
    expect(judges(level, ls)).toBe(false)
  })
})
