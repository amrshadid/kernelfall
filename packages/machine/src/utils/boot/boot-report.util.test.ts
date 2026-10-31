import { describe, expect, it } from 'vitest'
import { BOOT_REPORT } from '#test/boot-report'
import { BOOT_REPORT_SCRIPT, parseBootReport, parseKernelLog } from '#utils/boot/boot-report.util'

describe("the guest's boot report", () => {
  it('asks for every section, and for all of dmesg', () => {
    for (const section of ['dmesg', 'pci', 'net', 'mounts', 'meminfo', 'cpus']) {
      expect(BOOT_REPORT_SCRIPT).toContain(`echo @kf:${section};`)
    }
    expect(BOOT_REPORT_SCRIPT).toContain('dmesg -s 1048576')
  })

  it('gives back the pids it took, with builtins only around it', () => {
    expect(BOOT_REPORT_SCRIPT.startsWith('read kf_pid < /proc/sys/kernel/ns_last_pid; ')).toBe(true)
    expect(BOOT_REPORT_SCRIPT.endsWith('; echo "$kf_pid" > /proc/sys/kernel/ns_last_pid; unset kf_pid')).toBe(true)
  })

  it("sums up the VM's real boot", () => {
    const facts = parseBootReport(BOOT_REPORT)
    expect(facts.cpus).toBe(1)
    expect(facts.boot?.summary).toEqual({
      kernel: '6.18.59-0-virt',
      cmdline: 'console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K quiet',
      firmware: 'bios',
      outcome: 'init',
      failedStage: null,
      unknownParams: [],
      memTotalKb: 224052,
      pci: [
        { slot: '0000:00:00.0', driver: null },
        { slot: '0000:00:01.0', driver: null },
        { slot: '0000:00:06.0', driver: 'virtio-pci' },
        { slot: '0000:00:0a.0', driver: 'virtio-pci' },
        { slot: '0000:00:12.0', driver: null },
        { slot: '0000:00:1e.0', driver: 'ata_piix' },
      ],
      netDevices: ['eth0', 'lo'],
      rootDevice: 'host9p',
    })
  })

  it('keeps the log with its timestamps, for the boot lens', () => {
    const log = parseBootReport(BOOT_REPORT).boot?.log ?? []
    expect(log).toHaveLength(15)
    expect(log[11]).toEqual({ time: 2.3803, text: 'Run /init as init process' })
    expect(log[12]).toEqual({ time: 2.380368, text: '  with arguments:' })
  })

  it('reads parameters the kernel passed on, UEFI, a panic and a boot stuck in the initramfs', () => {
    const report = BOOT_REPORT.replace(
      '[    0.135237] Kernel',
      '[    0.000000] efi: EFI v2.7 by EDK II\n[    0.135000] Unknown kernel command line parameters "kf=1 foo", will be passed to user space.\n[    0.135237] Kernel'
    )
    expect(parseBootReport(report).boot?.summary).toMatchObject({ firmware: 'uefi', unknownParams: ['kf=1', 'foo'] })
    const panic = `${BOOT_REPORT.replace('@kf:pci', '[    3.1] Kernel panic - not syncing: No working init found.\n@kf:pci')}`
    expect(parseBootReport(panic).boot?.summary).toMatchObject({ outcome: 'panic', failedStage: 'kernel' })
    const stuck = BOOT_REPORT.replace('host9p / 9p', 'rootfs / rootfs')
    expect(parseBootReport(stuck).boot?.summary).toMatchObject({ outcome: 'initramfs', failedStage: 'root' })
  })

  it('joins a line without a timestamp to the one before, and has no boot without a log', () => {
    expect(parseKernelLog('[    1.000000] first\n  more\n[    2.500000] second\n')).toEqual([
      { time: 1, text: 'first\n  more' },
      { time: 2.5, text: 'second' },
    ])
    expect(parseBootReport('nothing')).toEqual({ cpus: 1, boot: null })
  })
})
