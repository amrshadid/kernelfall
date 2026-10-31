import { describe, expect, it } from 'vitest'
import {
  CARD_DRIVER,
  FULL_MEMORY_KIB,
  INIT_PID,
  KERNEL_THREAD,
  SYSTEM_INIT,
} from '#content/0-prologue/2-machine-in-section/10-bring-it-up/checker.ts'
import { LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'
import { machineFacts } from '#test/machine-facts'

const SHELL = 474
const level = levelUnderTest('prologue-machine-in-section-10-bring-it-up')
const FACTS = machineFacts().outputs
const MEMINFO = FACTS['head -5 /proc/meminfo'] ?? ''
const PS = FACTS.ps ?? ''
const CMDLINE = `BOOT_IMAGE=/boot/vmlinuz-virt ${FACTS['cat /proc/cmdline'] ?? ''}\n`
// What `free` printed after a boot with mem=64M (runs/…/root-only).
const FREE_64M = `              total        used        free      shared  buff/cache   available
Mem:          45524       15044       27284           4        3196       27784
Swap:             0           0           0
`

// cat reads to the end: the kernel's last answer is 0.
const catted = (pid: number, path: string, text: string) =>
  new LabEventLog()
    .spawn(SHELL, pid, '/bin/cat')
    .readFile(pid, path, text)
    .call(pid, 'read', [3, 0x10000, 262144], 0)
    .write(pid, 1, text)
    .exit(pid, SHELL).events

const free = (text: string, meminfo: string) =>
  new LabEventLog()
    .spawn(SHELL, 321, '/usr/bin/free')
    .readFile(321, '/proc/meminfo', meminfo)
    .write(321, 1, text)
    .exit(321, SHELL).events

const cardLink = (target: string) =>
  new LabEventLog()
    .spawn(SHELL, 322, '/usr/bin/readlink')
    .readLink(322, '/sys/class/net/eth0/device/driver', target)
    .exit(322, SHELL).events

// As the Machine traced BusyBox readlink (runs/…/solution): the path and the length, no target.
const untracedLink = new LabEventLog()
  .spawn(SHELL, 479, '/usr/bin/readlink')
  .call(479, 'readlink', [0x10000, 0x10000, 4096], 41, { data: '/sys/class/net/eth0/device/driver' })
  .exit(479, SHELL).events

const table = (text: string) =>
  new LabEventLog().spawn(SHELL, 323, '/bin/ps').write(323, 1, text).exit(323, SHELL).events

describe('Bring the Machine Up', () => {
  it("knows the Machine's own driver link, memory and process table", () => {
    expect(FACTS['readlink /sys/class/net/eth0/device/driver']).toMatch(new RegExp(`${CARD_DRIVER}$`))
    expect(Number(/^MemTotal:\s+(\d+) kB$/m.exec(MEMINFO)?.[1])).toBeGreaterThan(FULL_MEMORY_KIB)
    expect(PS).toMatch(new RegExp(`^\\s+${INIT_PID} root\\s+\\S+ ${SYSTEM_INIT}$`, 'm'))
    expect(PS).toContain(KERNEL_THREAD)
  })

  it('passes once the Machine is fully up, with zero Taint', () => {
    const verdict = verdictOf(level, [
      catted(320, '/proc/cmdline', CMDLINE),
      catted(324, '/proc/meminfo', MEMINFO),
      cardLink(FACTS['readlink /sys/class/net/eth0/device/driver'] ?? ''),
      table(`${PS}\n`),
      catted(340, '/sys/class/net/eth0/operstate', 'up\n'),
    ])

    expect(verdict).toEqual({ passed: true, missing: [], taint: [] })
  })

  it('finds the root only in a command line without the wrong root=', () => {
    expect(metBy(level, catted(320, '/proc/cmdline', CMDLINE))).toEqual(['root-found'])
    expect(metBy(level, catted(320, '/proc/cmdline', CMDLINE.replace('quiet', 'quiet root=/dev/sda3')))).toEqual([])
  })

  it("wants the Machine's whole memory, read from /proc/meminfo or from free, and not what mem=64M leaves", () => {
    expect(metBy(level, catted(324, '/proc/meminfo', 'MemTotal:          45524 kB\n'))).toEqual([])
    expect(metBy(level, free(FREE_64M, 'MemTotal:          45524 kB\n'))).toEqual([])
    expect(metBy(level, catted(324, '/proc/meminfo', MEMINFO))).toEqual(['full-memory'])
    expect(metBy(level, free(`${FACTS.free ?? ''}\n`, MEMINFO))).toEqual(['full-memory'])
  })

  it("wants eth0's driver link to resolve, and to name virtio_net when its target is traced", () => {
    expect(metBy(level, cardLink('../../../../bus/virtio/drivers/virtio_net'))).toEqual(['card-bound'])
    expect(metBy(level, untracedLink)).toEqual(['card-bound'])
    expect(metBy(level, cardLink('../../../bus/pci/drivers/virtio-pci'))).toEqual([])
  })

  it('wants BusyBox ps to list init as PID 1 and the kernel threads', () => {
    expect(metBy(level, table(`${PS}\n`))).toEqual(['processes-listed'])
    expect(metBy(level, table('PID   USER     TIME  COMMAND\n  479 you       0:00 -bash\n'))).toEqual([])
  })

  it('wants operstate to say up, read to the end', () => {
    expect(metBy(level, catted(340, '/sys/class/net/eth0/operstate', 'up\n'))).toEqual(['operstate-up'])
    expect(metBy(level, catted(340, '/sys/class/net/eth0/operstate', 'down\n'))).toEqual([])
  })
})
