import type { BootRecord } from '@kernelfall/machine/types'
import { parseBootReport } from '@kernelfall/machine/utils'

// The boot report as the Machine printed it (Alpine 3.24, 6.18.59-0-virt in v86). dmesg keeps every
// line the boot view reads and some it must skip; the lines themselves are unchanged.
const REPORT = `@kf:dmesg
[    0.000000] Linux version 6.18.59-0-virt (buildozer@build-3-24-x86) (cc (Alpine 15.2.0) 15.2.0, GNU ld (GNU Binutils) 2.45.1) #1-Alpine SMP PREEMPT_DYNAMIC 2026-10-27 14:58:36
[    0.000000] BIOS-provided physical RAM map:
[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable
[    0.000000] BIOS-e820: [mem 0x000000000009fc00-0x000000000009ffff] reserved
[    0.000000] BIOS-e820: [mem 0x00000000000f0000-0x00000000000fffff] reserved
[    0.000000] BIOS-e820: [mem 0x0000000000100000-0x000000000effffff] usable
[    0.000000] BIOS-e820: [mem 0x000000000f000000-0x000000000fffffff] reserved
[    0.000000] BIOS-e820: [mem 0x00000000fffc0000-0x00000000ffffffff] reserved
[    0.000000] NX (Execute Disable) protection: active
[    0.000000] DMI not present or invalid.
[    0.000000] tsc: Detected 1000.000 MHz processor
[    0.048815] RAMDISK: [mem 0x04000000-0x040c7fff]
[    0.079889] Kernel command line: console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on
[    0.082838] random: crng init done
[    0.557160] smpboot: Total of 1 processors activated (2000.00 BogoMIPS)
[    0.557641] Memory: 220660K/245368K available (10068K kernel code, 1054K rwdata, 3828K rodata, 952K init, 272K bss, 23004K reserved, 0K cma-reserved)
[    0.559633] devtmpfs: initialized
[    0.573863] NET: Registered PF_NETLINK/PF_ROUTE protocol family
[    0.587303] PCI: PCI BIOS revision 2.10 entry at 0xfdb22, last bus=0
[    0.605160] SCSI subsystem initialized
[    0.634160] PCI: Probing PCI hardware
[    0.636160] pci 0000:00:00.0: [8086:1237] type 00 class 0x060000 conventional PCI endpoint
[    0.639994] pci 0000:00:06.0: [1af4:1049] type 00 class 0x000200 conventional PCI endpoint
[    0.640160] pci 0000:00:06.0: BAR 0 [io  0xc100-0xc13f]
[    0.644150] pci 0000:00:1e.0: [8086:7010] type 00 class 0x010180 conventional PCI endpoint
[    0.935941] Unpacking initramfs...
[    1.432642] virtio-pci 0000:00:06.0: found PCI INT A -> IRQ 10
[    1.517015] Freeing initrd memory: 800K
[    1.529700] serial8250: ttyS0 at I/O 0x3f8 (irq = 4, base_baud = 115200) is a 16550A
[    1.604536] scsi host0: ata_piix
[    1.620198] ata1: PATA max MWDMA2 cmd 0x1f0 ctl 0x3f6 bmdma 0xc180 irq 14 lpm-pol 0
[    1.631644] input: AT Translated Set 2 keyboard as /devices/platform/i8042/serio0/input/input0
[    1.650198] rtc_cmos rtc_cmos: registered as rtc0
[    2.118784] Freeing unused kernel image (initmem) memory: 952K
[    2.122828] Write protecting kernel text and read-only data: 13900k
[    2.132003] Run /init as init process
[    2.702266] netfs: FS-Cache loaded
[    2.780962] 9pnet: Installing 9P2000 support
[    2.875111] 9p: Installing v9fs 9p2000 file system support
@kf:pci
0000:00:00.0
0000:00:06.0 virtio-pci
0000:00:1e.0 ata_piix
@kf:net
eth0
lo
@kf:mounts
dev /dev devtmpfs rw,relatime,size=111144k,nr_inodes=27786,mode=755 0 0
host9p / 9p rw,relatime,cache=0x5,access=client,msize=512000,trans=virtio 0 0
proc /proc proc rw,relatime 0 0
@kf:meminfo
MemTotal:         224052 kB
@kf:cpus
1
`

/** The Machine's boot record, through the machine package's own parser. */
export function machineBoot(): BootRecord {
  const boot = parseBootReport(REPORT).boot
  if (!boot) {
    throw new Error('the boot report fixture has no kernel log')
  }
  return boot
}

/** The same boot, as if it had stopped somewhere else: a record changed field by field. */
export function bootWith(change: (record: BootRecord) => BootRecord): BootRecord {
  return change(machineBoot())
}
