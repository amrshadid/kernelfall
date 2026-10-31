// models arch/x86/include/asm/setup.h: COMMAND_LINE_SIZE
export const COMMAND_LINE_SIZE = 2048

export const FIRMWARE_KINDS = ['uefi', 'bios'] as const
/** UEFI on current PCs; BIOS, which runs the MBR's boot code, on older ones. */
export type FirmwareKind = (typeof FIRMWARE_KINDS)[number]

/** The stages a boot passes through, in order. */
export const BOOT_STAGES = ['firmware', 'bootloader', 'kernel', 'initcalls', 'initramfs', 'root', 'init'] as const
export type BootStageId = (typeof BOOT_STAGES)[number]

export interface PciBinding {
  /** 0000:00:02.0 */
  readonly slot: string
  /** The driver that took the device, or null if none did. */
  readonly driver: string | null
}

/** How a boot ended: init from the real root, the initramfs's emergency shell, or a panic. */
export type BootOutcomeKind = 'init' | 'initramfs' | 'panic'

/** What a checker needs to know about a boot, small enough to send as an event. */
export interface BootSummary {
  readonly kernel: string
  readonly cmdline: string
  readonly firmware: FirmwareKind
  readonly outcome: BootOutcomeKind
  /** The stage that stopped the boot, or null if init started. */
  readonly failedStage: BootStageId | null
  readonly unknownParams: readonly string[]
  readonly memTotalKb: number
  readonly pci: readonly PciBinding[]
  readonly netDevices: readonly string[]
  readonly rootDevice: string | null
}

/** One line of the kernel's log, as `dmesg` prints it: `[    1.733345] scsi host0: ata_piix`. */
export interface KernelLogLine {
  /** Seconds since the kernel started. */
  readonly time: number
  readonly text: string
}

/** The Machine's boot as its kernel logged it, read once Linux is up. */
export interface BootRecord {
  readonly summary: BootSummary
  readonly log: readonly KernelLogLine[]
}

/** A level.yaml `lab.boot:` block: how the Machine's boot entry reads before the player touches it. */
export interface LabBootSetup {
  /** The boot entry's kernel arguments. */
  readonly args?: string
  readonly firmware?: FirmwareKind
}

/** The kernel's file in the image, as Alpine's linux-virt installs it. */
export const BOOT_KERNEL_PATH = '/boot/vmlinuz-virt'
