import { describe, expect, it } from 'vitest'
import { bootWith, machineBoot } from '@/test/fixtures/boot-record.fixture'
import { bootViewOf, dmesgLine } from './boot-view.util'

describe('bootViewOf', () => {
  it("draws the Machine's boot in the order it happened, each stage from its own lines", () => {
    const view = bootViewOf(machineBoot())
    expect(view.kernel).toBe('6.18.59-0-virt')
    expect(view.stages.map((stage) => stage.kind)).toEqual([
      'firmware',
      'kernel',
      'cmdline',
      'initcalls',
      'initramfs',
      'init',
      'root',
    ])
    expect(view.stages.map((stage) => stage.time)).toEqual([0, 0, 0.079889, 0.559633, 0.935941, 2.118784, 2.780962])
    expect(view.stages.some((stage) => stage.failed)).toBe(false)
  })

  it('keeps each line as the kernel logged it, and leaves out what no stage reads', () => {
    const view = bootViewOf(machineBoot())
    const texts = view.stages.flatMap((stage) => stage.lines.map((line) => line.text))
    expect(texts).toContain('BIOS-e820: [mem 0x0000000000100000-0x000000000effffff] usable')
    expect(texts).toContain('scsi host0: ata_piix')
    expect(texts).toContain('Write protecting kernel text and read-only data: 13900k')
    expect(texts).not.toContain('random: crng init done')
    expect(texts).not.toContain('netfs: FS-Cache loaded')
    expect(texts).not.toContain('pci 0000:00:06.0: BAR 0 [io  0xc100-0xc13f]')
    expect(view.log).toHaveLength(machineBoot().log.length)
    expect(view.end).toBe(2.875111)
  })

  it('names the BIOS, PID 1 from the initramfs and the root device /proc/mounts gives', () => {
    const notes = Object.fromEntries(bootViewOf(machineBoot()).stages.map((stage) => [stage.kind, stage.note]))
    expect(notes.firmware).toContain('BIOS')
    expect(notes.init).toContain('runs `/init` as PID 1')
    expect(notes.init).toContain('from the initramfs')
    expect(notes.root).toContain('`host9p`')
  })

  it("splits the command line, marking what the kernel didn't know", () => {
    const view = bootViewOf(
      bootWith((record) => ({
        ...record,
        summary: { ...record.summary, cmdline: 'console=ttyS0 rw kf.bogus=1', unknownParams: ['kf.bogus=1'] },
      }))
    )
    expect(view.params).toEqual([
      { text: 'console=ttyS0', unknown: false },
      { text: 'rw', unknown: false },
      { text: 'kf.bogus=1', unknown: true },
    ])
    expect(view.stages.find((stage) => stage.kind === 'cmdline')?.note).toContain('passed on to init')
  })

  it("keeps init's argument lines with it", () => {
    const view = bootViewOf(
      bootWith((record) => ({
        ...record,
        log: [
          { time: 2.3803, text: 'Run /init as init process' },
          { time: 2.380368, text: '  with arguments:' },
          { time: 2.38043, text: '    /init' },
          { time: 3.025657, text: '9p: Installing v9fs 9p2000 file system support' },
        ],
      }))
    )
    expect(view.stages.find((stage) => stage.kind === 'init')?.lines).toHaveLength(3)
    expect(view.stages.find((stage) => stage.kind === 'root')?.lines).toHaveLength(1)
  })

  it('draws nothing the record lacks: no firmware lines, no firmware stage', () => {
    const view = bootViewOf(
      bootWith((record) => ({ ...record, log: record.log.filter((line) => !line.text.startsWith('BIOS')) }))
    )
    const firmware = view.stages.find((stage) => stage.kind === 'firmware')
    // Only the lines that remain: DMI and the PCI BIOS entry.
    expect(firmware?.lines.map((line) => line.text)).toEqual([
      'DMI not present or invalid.',
      'PCI: PCI BIOS revision 2.10 entry at 0xfdb22, last bus=0',
    ])
    const bare = bootViewOf(bootWith((record) => ({ ...record, log: record.log.slice(0, 1) })))
    expect(bare.stages.map((stage) => stage.kind)).toEqual(['kernel', 'root'])
  })

  it('marks the root red when the boot stayed in the initramfs', () => {
    const view = bootViewOf(
      bootWith((record) => ({
        ...record,
        summary: { ...record.summary, outcome: 'initramfs', failedStage: 'root', rootDevice: 'rootfs' },
      }))
    )
    const root = view.stages.find((stage) => stage.kind === 'root')
    expect(root?.failed).toBe(true)
    expect(root?.note).toContain('never mounted')
    expect(view.marks.find((mark) => mark.failed)?.number).toBe(view.stages.length)
  })

  it('ends at a panic', () => {
    const view = bootViewOf(
      bootWith((record) => ({
        ...record,
        log: [
          ...record.log.slice(0, 13),
          {
            time: 2.2,
            text: 'Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)',
          },
        ],
        summary: { ...record.summary, outcome: 'panic', failedStage: 'kernel', rootDevice: null },
      }))
    )
    expect(view.stages.at(-1)).toMatchObject({ kind: 'panic', failed: true })
  })

  it('labels the ruler only where labels have room', () => {
    const { marks } = bootViewOf(machineBoot())
    expect(marks.map((mark) => mark.labelled)).toEqual([true, false, false, true, true, true, true])
    expect(marks.at(-1)?.at).toBeCloseTo(2.780962 / 2.875111)
  })
})

describe('dmesgLine', () => {
  it('prints a line the way dmesg does', () => {
    expect(dmesgLine({ time: 1.604536, text: 'scsi host0: ata_piix' })).toBe('[    1.604536] scsi host0: ata_piix')
    expect(dmesgLine({ time: 0, text: 'Linux version' })).toBe('[    0.000000] Linux version')
  })
})
