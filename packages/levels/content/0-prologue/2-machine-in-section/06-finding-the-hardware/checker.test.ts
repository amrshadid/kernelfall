import { describe, expect, it } from 'vitest'
import { judges, LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'
import { machineFacts } from '#test/machine-facts'

const SHELL = 474
const level = levelUnderTest('prologue-machine-in-section-06-finding-the-hardware')

const readlink = (path: string, target: string) =>
  new LabEventLog().spawn(SHELL, 321, '/usr/bin/readlink').readLink(321, path, target).exit(321, SHELL).events

const diskLink = readlink('/sys/bus/pci/devices/0000:00:1e.0/driver', '../../../bus/pci/drivers/ata_piix')

const dtc = (status: number) =>
  new LabEventLog()
    .spawn(SHELL, 322, '/usr/bin/dtc')
    .readFile(322, 'lighthouse.dts', '/dts-v1/;\n')
    .exit(322, SHELL, { code: status }).events

const boardBoot = (log: string) =>
  new LabEventLog().spawn(SHELL, 323, '/usr/local/bin/board').write(323, 1, log).exit(323, SHELL).events

const MODEL = 'OF: fdt: Machine model: Socket Harbor lighthouse\n'
const GPIO = 'pinctrl-bcm2835 7e200000.gpio: probed\n'
const GPIO_ONLY = `${MODEL}${GPIO}leds: no driver matches "gpio-led"\n/sys/class/leds: (none)\n`
const LAMP_LIT = `${MODEL}${GPIO}leds-gpio leds: probed\n/sys/class/leds: lighthouse:lamp\n`

describe('Finding the Hardware', () => {
  it('passes with the disk link read, the fixed tree compiled and the lamp bound, with zero Taint', () => {
    expect(verdictOf(level, [diskLink, dtc(0), boardBoot(LAMP_LIT)])).toEqual({ passed: true, missing: [], taint: [] })
  })

  it("looks for the driver lspci names for the Machine's IDE controller, at its address", () => {
    const lspci = machineFacts().outputs['lspci -nnk'] ?? ''

    expect(lspci).toMatch(/^00:1e\.0 IDE interface .*\n.*\n\tKernel driver in use: ata_piix$/m)
  })

  it('reads the disk link by its path, or by where it points from inside the device folder', () => {
    expect(metBy(level, diskLink)).toEqual(['reads-disk-driver'])
    expect(metBy(level, readlink('driver', '../../../bus/pci/drivers/ata_piix'))).toEqual(['reads-disk-driver'])
  })

  it("doesn't take the network card's link for the disk's", () => {
    expect(
      metBy(level, readlink('/sys/bus/pci/devices/0000:00:0a.0/driver', '../../../bus/pci/drivers/virtio-pci'))
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
