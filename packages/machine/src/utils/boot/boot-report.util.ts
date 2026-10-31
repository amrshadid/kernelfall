import type { BootOutcomeKind, BootRecord, BootStageId, KernelLogLine, PciBinding } from '#types/definitions/boot'
import { VM_CPUS, type VmFacts } from '#types/definitions/vm'

const SECTION = '@kf:'
const SECTIONS = ['dmesg', 'pci', 'net', 'mounts', 'meminfo', 'cpus'] as const
type Section = (typeof SECTIONS)[number]

// More than the 128 KiB log buffer, so the whole boot comes back whatever BusyBox reads by default.
const DMESG_BYTES = 1 << 20

const COMMANDS: Readonly<Record<Section, string>> = {
  dmesg: `dmesg -s ${DMESG_BYTES}`,
  // `<slot> <driver>`: the driver link is missing when nothing bound the device.
  pci: 'for d in /sys/bus/pci/devices/*; do echo "$(basename "$d") $(basename "$(readlink "$d/driver")" 2>/dev/null)"; done',
  net: 'for n in /sys/class/net/*; do basename "$n"; done',
  mounts: 'cat /proc/mounts',
  meminfo: 'cat /proc/meminfo',
  cpus: 'nproc',
}

/** One control line that prints every section the report needs, each after its `@kf:<name>` header. */
export const BOOT_REPORT_SCRIPT = SECTIONS.map((name) => `echo ${SECTION}${name}; ${COMMANDS[name]}`).join('; ')

const LOG_LINE = /^\[\s*(\d+\.\d+)\] ?(.*)$/
const KERNEL = /^Linux version (\S+)/
const CMDLINE = /^Kernel command line: (.*)$/
const UNKNOWN = /^Unknown kernel command line parameters "([^"]*)"/
// Only a UEFI boot has the EFI stub log its firmware's revision (drivers/firmware/efi/efi.c).
const UEFI = /^efi: EFI v\d/
const PANIC = /^Kernel panic - not syncing/
const MEM_TOTAL = /^MemTotal:\s+(\d+) kB$/m
/** The initramfs's own root: still on it means switch_root never ran. */
const INITRAMFS_ROOT = 'rootfs'

function sectionsOf(output: string): Record<Section, string> {
  const found = Object.fromEntries(SECTIONS.map((name) => [name, ''])) as Record<Section, string>
  let current: Section | null = null
  for (const line of output.split('\n')) {
    const name = line.startsWith(SECTION) ? line.slice(SECTION.length).trim() : null
    if (name !== null && (SECTIONS as readonly string[]).includes(name)) {
      current = name as Section
    } else if (current) {
      found[current] += `${line}\n`
    }
  }
  return found
}

const linesOf = (text: string) => text.split('\n').filter((line) => line.trim() !== '')

/** `dmesg` text → its lines; a line without a timestamp continues the one before. */
export function parseKernelLog(dmesg: string): KernelLogLine[] {
  const log: KernelLogLine[] = []
  for (const line of linesOf(dmesg)) {
    const match = LOG_LINE.exec(line)
    if (match) {
      log.push({ time: Number(match[1]), text: match[2] ?? '' })
    } else if (log.length > 0) {
      const last = log.pop() as KernelLogLine
      log.push({ ...last, text: `${last.text}\n${line}` })
    }
  }
  return log
}

function pciOf(text: string): PciBinding[] {
  return linesOf(text).map((line) => {
    const [slot = '', driver] = line.trim().split(/\s+/)
    return { slot, driver: driver || null }
  })
}

/** The device mounted on `/`, from /proc/mounts. */
function rootOf(mounts: string): string | null {
  const root = linesOf(mounts)
    .map((line) => line.split(' '))
    .filter((fields) => fields[1] === '/')
    .at(-1)
  return root?.[0] ?? null
}

/** The guest's report (BOOT_REPORT_SCRIPT's output) → what the Machine says about itself. */
export function parseBootReport(output: string): VmFacts {
  const sections = sectionsOf(output)
  const log = parseKernelLog(sections.dmesg)
  const find = (pattern: RegExp) => {
    for (const line of log) {
      const match = pattern.exec(line.text)
      if (match) return match
    }
    return null
  }
  const rootDevice = rootOf(sections.mounts)
  const outcome: BootOutcomeKind = find(PANIC)
    ? 'panic'
    : rootDevice === null || rootDevice === INITRAMFS_ROOT
      ? 'initramfs'
      : 'init'
  const failedStage: BootStageId | null = outcome === 'panic' ? 'kernel' : outcome === 'initramfs' ? 'root' : null
  const cpus = Number.parseInt(sections.cpus, 10)
  const boot: BootRecord = {
    summary: {
      kernel: find(KERNEL)?.[1] ?? '',
      cmdline: find(CMDLINE)?.[1] ?? '',
      firmware: find(UEFI) ? 'uefi' : 'bios',
      outcome,
      failedStage,
      unknownParams: (find(UNKNOWN)?.[1] ?? '').split(' ').filter((param) => param !== ''),
      memTotalKb: Number(MEM_TOTAL.exec(sections.meminfo)?.[1] ?? 0),
      pci: pciOf(sections.pci),
      netDevices: linesOf(sections.net).map((name) => name.trim()),
      rootDevice,
    },
    log,
  }
  return { cpus: cpus > 0 ? cpus : VM_CPUS, boot: log.length > 0 ? boot : null }
}
