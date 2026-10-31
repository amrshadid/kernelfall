import { describe, expect, it } from 'vitest'
import { judges, LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'

const SHELL = 300
const level = levelUnderTest('prologue-machine-in-section-06-finding-the-hardware')

const readlink = (path: string, target: string) =>
  new LabEventLog().spawn(SHELL, 321, '/bin/ls').readLink(321, path, target).exit(321, SHELL).events

const diskLink = readlink('/sys/bus/pci/devices/0000:00:01.0/driver', '../../../bus/pci/drivers/virtio-pci')

const dtc = (status: number) =>
  new LabEventLog()
    .spawn(SHELL, 322, '/bin/dtc')
    .readFile(322, 'lighthouse.dts', '/dts-v1/;\n')
    .exit(322, SHELL, { code: status }).events

const boardBoot = (log: string) =>
  new LabEventLog().spawn(SHELL, 323, '/bin/board').write(323, 1, log).exit(323, SHELL).events

const GPIO_ONLY = 'pinctrl-bcm2835 7e200000.gpio: probed\n$ ls /sys/class/leds\n'
const LAMP_LIT =
  'pinctrl-bcm2835 7e200000.gpio: probed\nleds-gpio leds: probed\n$ ls /sys/class/leds\nlighthouse:lamp\n'

describe('Finding the Hardware', () => {
  it('passes with the disk link read, the fixed tree compiled and the lamp bound, with zero Taint', () => {
    const verdict = verdictOf(level, [diskLink, dtc(0), boardBoot(LAMP_LIT)])

    expect(verdict).toEqual({ passed: true, missing: [], taint: [] })
  })

  it('reads the disk link by its path, or by where it points from inside the device folder', () => {
    expect(metBy(level, diskLink)).toEqual(['reads-disk-driver'])
    expect(metBy(level, readlink('driver', '../../../bus/pci/drivers/virtio-pci'))).toEqual(['reads-disk-driver'])
  })

  it("doesn't take the network card's link for the disk's", () => {
    expect(
      metBy(level, readlink('/sys/bus/pci/devices/0000:00:02.0/driver', '../../../bus/pci/drivers/e1000'))
    ).toEqual([])
  })

  it('counts dtc only when it compiled lighthouse.dts without an error', () => {
    expect(metBy(level, dtc(0))).toEqual(['compiles-dts'])
    expect(metBy(level, dtc(1))).toEqual([])
  })

  it('shows what the starter tree gets: the GPIO controller binds, the lamp has no driver', () => {
    expect(metBy(level, boardBoot(GPIO_ONLY))).toEqual([])
    expect(metBy(level, boardBoot(LAMP_LIT))).toEqual(['lamp-binds'])
  })

  it('judges dtc, the board and reading the link, not other commands', () => {
    const cat = new LabEventLog().spawn(SHELL, 324, '/bin/cat').exit(324, SHELL).events

    expect(judges(level, dtc(0))).toBe(true)
    expect(judges(level, diskLink)).toBe(true)
    expect(judges(level, cat)).toBe(false)
  })
})
