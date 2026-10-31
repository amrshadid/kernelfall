import { describe, expect, it } from 'vitest'
import { LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'

const SHELL = 300
const level = levelUnderTest('prologue-machine-in-section-10-bring-it-up')

/** A boot: the kernel runs the initramfs's /init as PID 1, which hands over to /sbin/init once it finds the root. */
const boot = (rootFound: boolean) => {
  const log = new LabEventLog().exec(1, '/init')
  return (rootFound ? log.exec(1, '/sbin/init') : log).events
}

const meminfo = (totalKib: number) =>
  new LabEventLog()
    .spawn(SHELL, 320, '/bin/cat')
    .readFile(320, '/proc/meminfo', `MemTotal:       ${totalKib} kB\nMemFree:        400000 kB\n`)
    .exit(320, SHELL).events

const free = (totalKib: number) =>
  new LabEventLog()
    .spawn(SHELL, 321, '/bin/free')
    .readFile(321, '/proc/meminfo', `MemTotal:       ${totalKib} kB\n`)
    .write(
      321,
      1,
      `               total        used        free      shared  buff/cache   available\nMem:       ${totalKib}       38212      421508         120       42620      449860\n`
    )
    .exit(321, SHELL).events

const cardLink = (target: string) =>
  new LabEventLog()
    .spawn(SHELL, 322, '/bin/ls')
    .readLink(322, '/sys/bus/pci/devices/0000:00:02.0/driver', target)
    .exit(322, SHELL).events

const PS =
  '  PID TTY          TIME CMD\n    1 ?        00:00:00 init\n    2 ?        00:00:00 kthreadd\n  300 tty1     00:00:00 rescue\n'
const ps = new LabEventLog().spawn(SHELL, 323, '/bin/ps').write(323, 1, PS).exit(323, SHELL).events

const operstate = (state: string) =>
  new LabEventLog()
    .spawn(SHELL, 340, '/bin/cat')
    .readFile(340, '/sys/class/net/eth0/operstate', state)
    .call(340, 'read', [3, 0x10000, 262144], 0)
    .write(340, 1, state)
    .exit(340, SHELL).events

describe('Bring the Machine Up', () => {
  it('passes once the Machine is fully up, with zero Taint', () => {
    const verdict = verdictOf(level, [
      boot(true),
      meminfo(502340),
      cardLink('../../../bus/pci/drivers/e1000'),
      ps,
      operstate('up\n'),
    ])

    expect(verdict).toEqual({ passed: true, missing: [], taint: [] })
  })

  it('counts the root found only when PID 1 hands over to /sbin/init', () => {
    expect(metBy(level, boot(false))).toEqual([])
    expect(metBy(level, boot(true))).toEqual(['root-found'])
  })

  it('wants the full memory, read from /proc/meminfo or from free', () => {
    expect(metBy(level, meminfo(41204))).toEqual([])
    expect(metBy(level, meminfo(502340))).toEqual(['full-memory'])
    expect(metBy(level, free(502340))).toEqual(['full-memory'])
  })

  it("wants the card's link to name e1000", () => {
    expect(metBy(level, cardLink('../../../bus/pci/drivers/e1000'))).toEqual(['e1000-bound'])
    expect(metBy(level, cardLink('../../../bus/pci/drivers/virtio-pci'))).toEqual([])
  })

  it('wants ps to list init as PID 1 and the kernel threads', () => {
    expect(metBy(level, ps)).toEqual(['processes-listed'])
    const shellOnly = new LabEventLog()
      .spawn(SHELL, 324, '/bin/ps')
      .write(324, 1, '  PID TTY          TIME CMD\n  300 tty1     00:00:00 rescue\n')
      .exit(324, SHELL).events
    expect(metBy(level, shellOnly)).toEqual([])
  })

  it('wants operstate to say up, read to the end', () => {
    expect(metBy(level, operstate('up\n'))).toEqual(['operstate-up'])
    expect(metBy(level, operstate('down\n'))).toEqual([])
  })
})
