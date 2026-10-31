// The Machine's data disk: an MBR with one ext4 partition, made by the guest's own mke2fs (Alpine's
// pinned e2fsprogs) on a blank disk, so the host needs no root, Docker or filesystem tools.
import { join } from 'node:path'
import { V86 } from 'v86'
import { createVmControl } from '#services/vm/vm-control.service'
import { VM_CMDLINE, VM_MEMORY_BYTES, VM_NET_DEVICE, VM_PROMPT } from '#types/definitions/vm'
import { shellQuote } from '#utils/vm-setup/setup-script.util'

const SECTOR = 512
export const DISK_BYTES = 8 * 1024 * 1024
/** fdisk's default first sector: 1 MiB in, aligned for any disk. */
const FIRST_SECTOR = 2048
const LINUX_PARTITION = 0x83
const MBR_TABLE = 446
const MBR_SIGNATURE = 0xaa55
/** The MBR's disk id, fixed so the image is the same every build. */
const DISK_ID = 0x4b46_0001
/** Fixed for the same reason: mke2fs would pick a random UUID, hash seed and the current time. */
const FS_UUID = '6b65726e-656c-4661-916c-000000000001'
const FS_LABEL = 'kernelfall'
const FS_TIME = 1_793_404_800
const BOOT_TIMEOUT_MS = 300_000
const MKFS_TIMEOUT_MS = 120_000
const CONTROL_UART = 2
const STAGING = '/tmp/kf-disk'

/** What the disk holds; mke2fs adds lost+found. Owned by root, as a fresh disk's files are. */
export const DISK_FILES: Readonly<Record<string, string>> = {
  README: `This is the Machine's disk: a real one, /dev/sda, partition 1, ext4.
Nothing mounts it at boot. Attach it to the tree yourself:

  mount /dev/sda1 /mnt
`,
  'logbook.txt': `Day 1. The kernel panicked. Every process froze where it stood.
Day 2. init came back. The shell answers again.
Day 3. Writing this down on the disk, where it outlives a reboot.
`,
  'notes/devices.txt': `sda    the whole disk, as the SCSI disk driver (sd) names it
sda1   its first partition, which holds this ext4 filesystem
`,
}

/** A blank disk with an MBR: one Linux partition from sector 2048 to the end. */
export function blankDisk(): Uint8Array<ArrayBuffer> {
  const disk = new Uint8Array(DISK_BYTES)
  const view = new DataView(disk.buffer)
  view.setUint32(440, DISK_ID, true)
  const entry = MBR_TABLE
  // CHS fields stay 0xfe/0xff/0xff ("use LBA"), as fdisk writes them for any modern disk.
  disk.set([0x00, 0xfe, 0xff, 0xff, LINUX_PARTITION, 0xfe, 0xff, 0xff], entry)
  view.setUint32(entry + 8, FIRST_SECTOR, true)
  view.setUint32(entry + 12, DISK_BYTES / SECTOR - FIRST_SECTOR, true)
  view.setUint16(510, MBR_SIGNATURE, true)
  return disk
}

/** The root commands that stage DISK_FILES and make the filesystem on /dev/sda1 from them. */
export function diskScript(): string[] {
  const base64 = (text: string) => btoa(String.fromCodePoint(...new TextEncoder().encode(text)))
  return [
    'modprobe sd_mod && until [ -b /dev/sda1 ]; do sleep 1; done',
    // mke2fs -d copies each file's ctime, which only the clock sets: this guest lives for the build.
    `date -s @${FS_TIME} > /dev/null`,
    ...Object.entries(DISK_FILES).map(([path, text]) => {
      const file = shellQuote(`${STAGING}/${path}`)
      return `mkdir -p "$(dirname ${file})" && echo ${base64(text)} | base64 -d > ${file}`
    }),
    `find ${STAGING} -exec touch -d @${FS_TIME} {} +`,
    `E2FSPROGS_FAKE_TIME=${FS_TIME} mke2fs -q -F -t ext4 -L ${FS_LABEL} -U ${FS_UUID} -E hash_seed=${FS_UUID},root_owner=0:0 -d ${STAGING} /dev/sda1 && sync`,
  ]
}

/** Boots the image in `imageDir` with a blank disk and has the guest make the filesystem on it. */
export async function buildDisk(imageDir: string, wasmPath: string): Promise<Uint8Array> {
  const disk = blankDisk()
  const emulator = new V86({
    wasm_path: wasmPath,
    bios: { url: join(imageDir, 'bios/seabios.bin') },
    vga_bios: { url: join(imageDir, 'bios/vgabios.bin') },
    bzimage: { url: join(imageDir, 'vmlinuz') },
    initrd: { url: join(imageDir, 'initramfs.cpio.gz') },
    cmdline: VM_CMDLINE,
    filesystem: { basefs: join(imageDir, 'fs.json'), baseurl: join(imageDir, 'flat/') },
    // v86 writes into this buffer itself, so it holds the disk the guest made.
    hda: { buffer: disk.buffer },
    net_device: VM_NET_DEVICE,
    memory_size: VM_MEMORY_BYTES,
    uart1: true,
    uart2: true,
    autostart: true,
    disable_keyboard: true,
    disable_mouse: true,
    disable_speaker: true,
  })
  try {
    const control = createVmControl((bytes) => emulator.serial_send_bytes(CONTROL_UART, bytes), MKFS_TIMEOUT_MS)
    emulator.add_listener('serial2-output-byte', (byte: number) => control.push(byte))
    await new Promise<void>((resolve, reject) => {
      let tail = ''
      const timer = setTimeout(() => reject(new Error(`the image did not boot: ${tail}`)), BOOT_TIMEOUT_MS)
      emulator.add_listener('serial0-output-byte', (byte: number) => {
        tail = (tail + String.fromCharCode(byte)).slice(-64)
        if (VM_PROMPT.test(tail)) {
          clearTimeout(timer)
          resolve()
        }
      })
    })
    for (const line of diskScript()) {
      const reply = await control.capture(line)
      if (reply.status !== 0) {
        throw new Error(`making the disk failed (${reply.status}) at: ${line}\n${reply.output}`)
      }
    }
    return disk
  } finally {
    await emulator.destroy()
  }
}
