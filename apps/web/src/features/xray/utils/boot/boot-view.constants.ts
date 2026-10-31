import type { BootStageKind } from '@features/xray/types'

export interface BootStageRule {
  readonly kind: BootStageKind
  readonly title: string
  /** dmesg lines (without their timestamp) that belong to the stage. */
  readonly patterns: readonly RegExp[]
  /** Indented lines right after a match continue it, like `Run /init`'s arguments. */
  readonly follow?: boolean
}

/** In the order Linux reaches them, which breaks ties between stages logged at the same moment. */
export const BOOT_STAGE_RULES: readonly BootStageRule[] = [
  {
    kind: 'firmware',
    title: 'Firmware',
    patterns: [/^BIOS-provided physical RAM map/, /^BIOS-e820: /, /^efi: /, /^DMI[: ]/, /^PCI: PCI BIOS revision/],
  },
  {
    kind: 'kernel',
    title: 'Kernel start',
    patterns: [/^Linux version /, /^Memory: \d+K\/\d+K available/, /^smpboot: Total of \d+ processors? activated/],
  },
  {
    kind: 'cmdline',
    title: 'Command line',
    patterns: [/^Kernel command line: /, /^Unknown kernel command line parameters/],
  },
  {
    kind: 'initcalls',
    title: 'Drivers and initcalls',
    patterns: [
      /^devtmpfs: initialized/,
      /^PCI: Probing PCI hardware/,
      /^pci [0-9a-f]{4}:[0-9a-f]{2}:[0-9a-f]{2}\.\d: \[[0-9a-f]{4}:[0-9a-f]{4}\]/,
      /^SCSI subsystem initialized/,
      /^NET: Registered /,
      /^Serial: /,
      /^serial8250: /,
      /^virtio[-_]\w+ \S+: /,
      /^scsi host\d+: /,
      /^ata\d+(\.\d+)?: /,
      /^scsi \d+:\d+:\d+:\d+: /,
      /^input: /,
      /^rtc_cmos \S+: registered as/,
    ],
  },
  {
    kind: 'initramfs',
    title: 'initramfs',
    patterns: [/^Trying to unpack rootfs image as initramfs/, /^Unpacking initramfs/, /^Freeing initrd memory/],
  },
  {
    kind: 'init',
    title: 'PID 1',
    patterns: [/^Freeing unused kernel image/, /^Write protecting kernel/, /^Run \S+ as init process/],
    follow: true,
  },
  {
    kind: 'root',
    title: 'Root filesystem',
    patterns: [
      /^VFS: Mounted root/,
      /^VFS: Cannot open root device/,
      /^9pnet: /,
      /^9p: /,
      /^EXT4-fs \([^)]+\): mounted filesystem/,
    ],
  },
  {
    kind: 'panic',
    title: 'Kernel panic',
    patterns: [/^Kernel panic - not syncing/, /^---\[ end Kernel panic/],
  },
]

export const INIT_PROCESS = /^Run (\S+) as init process/

/** The program the kernel runs from the initramfs (rdinit's default). */
export const INITRAMFS_INIT = '/init'

/** The root the initramfs gives: still on it means the real root never came. */
export const INITRAMFS_ROOT = 'rootfs'

export const BOOT_NOTES = {
  firmwareBios:
    "The BIOS ran before Linux and handed it a map of the machine's memory (`e820`): usable RAM and reserved ranges. The kernel prints the map as it starts.",
  firmwareUefi:
    "UEFI firmware ran before Linux and handed it the machine's memory map. The kernel's EFI code logs the firmware's revision.",
  kernel:
    "The kernel's first line names its release, the compiler that built it and the build. Then it sets up memory and the CPUs.",
  cmdline: 'The arguments the kernel was started with. It acts on the ones it knows.',
  cmdlineUnknown:
    "The arguments the kernel was started with. It acts on the ones it knows; the ones it doesn't (in red) are passed on to init.",
  initcalls:
    'Code built into the kernel starts one initcall at a time: buses are scanned, and drivers bind the devices they know.',
  initramfs:
    'An archive loaded with the kernel, the `initramfs`, is unpacked into `rootfs`: the first `/`, held in RAM.',
  panic: 'The kernel stopped with a panic: nothing after this line ran.',
} as const

/** Ruler labels closer than this (a fraction of the ruler) are left off; the tick stays. */
export const BOOT_LABEL_GAP = 0.08

/** Lines a stage shows before the rest fold away. */
export const BOOT_STAGE_LINES = 6
