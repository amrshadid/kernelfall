import type { LabEvent } from '@kernelfall/machine/events'
import { SIGSEGV } from '@kernelfall/machine/types'
import { describe, expect, it } from 'vitest'
import { judges, LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'
import { machineFacts } from '#test/machine-facts'

const SHELL = 300
const level = levelUnderTest('prologue-machine-in-section-05-kernel-up-close')

// `Linux kernelfall <release> #1-Alpine SMP PREEMPT_DYNAMIC <date> <time> <machine> Linux`
const UNAME_A = (machineFacts().outputs['uname -a'] ?? '').split(' ')
const SYSNAME = UNAME_A[0] ?? ''
const RELEASE = UNAME_A[2] ?? ''
const MACHINE = UNAME_A.at(-2) ?? ''
const SRM = `${SYSNAME} ${RELEASE} ${MACHINE}\n`

const KERNEL_SPACE = 0xc0000000
// A user-mode read of a present supervisor page: X86_PF_USER | X86_PF_PROT, as the Machine reports poke's.
const USER_PROT_FAULT = 5

const poke = (signal?: number, faultAt: number | null = KERNEL_SPACE): readonly LabEvent[] => {
  const fault: LabEvent[] =
    faultAt === null
      ? []
      : [
          {
            type: 'page_fault_user',
            pid: 321,
            address: faultAt,
            ip: 0x449000,
            errorCode: USER_PROT_FAULT,
            seq: 0,
            time: 0,
          },
        ]
  return [
    ...new LabEventLog().spawn(SHELL, 321, './poke').events,
    ...fault,
    ...new LabEventLog().exit(321, SHELL, signal === undefined ? {} : { signal }).events,
  ].map((event, seq) => ({ ...event, seq }))
}

const myuname = (printed: string) =>
  new LabEventLog()
    .spawn(SHELL, 322, './myuname')
    .call(322, 'newuname', [0x10000], 0, { out: SYSNAME })
    .write(322, 1, printed)
    .exit(322, SHELL).events

const unameCommand = (printed: string) =>
  new LabEventLog()
    .spawn(SHELL, 323, '/bin/uname')
    .call(323, 'newuname', [0x10000], 0, { out: SYSNAME })
    .write(323, 1, printed)
    .exit(323, SHELL).events

describe('The Kernel Up Close', () => {
  it('passes with poke, the reference myuname and uname -srm as the Machine prints them, with zero Taint', () => {
    const verdict = verdictOf(level, [poke(SIGSEGV), myuname(SRM), unameCommand(SRM)])

    expect(verdict).toEqual({ passed: true, missing: [], taint: [] })
  })

  it("knows the Machine's own answer: Linux, a 6.18 release and an i686 CPU", () => {
    expect([SYSNAME, MACHINE]).toEqual(['Linux', 'i686'])
    expect(RELEASE).toMatch(/^6\.18\./)
  })

  it('shows what the starter still misses: the CPU type', () => {
    expect(metBy(level, myuname(`${SYSNAME} ${RELEASE}\n`))).toEqual(['asks-uname', 'exits-zero'])
  })

  it('takes the three words in any order, but on one line', () => {
    expect(metBy(level, myuname(`${MACHINE} ${SYSNAME} ${RELEASE}\n`))).toContain('prints-machine')
    expect(metBy(level, myuname(`${SYSNAME}\n${RELEASE}\n${MACHINE}\n`))).not.toContain('prints-machine')
  })

  it('rejects the CPU type of another PC', () => {
    expect(metBy(level, myuname(`${SYSNAME} ${RELEASE} x86_64\n`))).not.toContain('prints-machine')
    expect(metBy(level, unameCommand(`${SYSNAME} ${RELEASE} x86_64\n`))).toEqual([])
  })

  it('counts poke only when the kernel killed it with SIGSEGV', () => {
    expect(metBy(level, poke(SIGSEGV))).toEqual(['poke-segfaults'])
    expect(metBy(level, poke())).toEqual([])
  })

  it('counts only a fault on a kernel address, not any SIGSEGV', () => {
    expect(metBy(level, poke(SIGSEGV, null))).toEqual([])
    expect(metBy(level, poke(SIGSEGV, 0))).toEqual([])
    expect(metBy(level, poke(SIGSEGV, KERNEL_SPACE - 1))).toEqual([])
  })

  it('takes the line only after the kernel answered uname', () => {
    const hardCoded = new LabEventLog().spawn(SHELL, 325, './myuname').write(325, 1, SRM).exit(325, SHELL).events

    expect(metBy(level, hardCoded)).not.toContain('prints-machine')
  })

  it('judges the uname command by what it printed', () => {
    expect(metBy(level, unameCommand(SRM))).toEqual(['compares-uname'])
  })

  it('judges poke, myuname and uname, not other commands', () => {
    const ls = new LabEventLog().spawn(SHELL, 324, '/bin/ls').exit(324, SHELL).events

    expect(judges(level, poke(SIGSEGV))).toBe(true)
    expect(judges(level, ls)).toBe(false)
  })
})
