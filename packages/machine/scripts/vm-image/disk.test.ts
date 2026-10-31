import { describe, expect, it } from 'vitest'
import { VM_CMDLINE } from '#types/definitions/vm'
import { blankDisk, DISK_BYTES, DISK_FILES, diskScript, GRUB_CFG } from '#vm-image/disk'

describe('the data disk', () => {
  it('starts as an MBR with one Linux partition from sector 2048 to the end', () => {
    const disk = blankDisk()
    const view = new DataView(disk.buffer)
    expect(disk.length).toBe(DISK_BYTES)
    expect(view.getUint16(510, true)).toBe(0xaa55)
    expect(disk[446 + 4]).toBe(0x83)
    expect(view.getUint32(446 + 8, true)).toBe(2048)
    expect(view.getUint32(446 + 12, true)).toBe(DISK_BYTES / 512 - 2048)
    // Only one entry: the other three stay empty.
    expect(disk.subarray(462, 510).every((byte) => byte === 0)).toBe(true)
  })

  it('stages every file and /boot, installs GRUB, then makes a reproducible ext4 from them on sda1', () => {
    const lines = diskScript()
    expect(lines[0]).toBe('modprobe sd_mod && until [ -b /dev/sda1 ]; do sleep 1; done')
    expect(lines[1]).toMatch(/^date -s @\d+ > \/dev\/null$/)
    expect(lines).toHaveLength(Object.keys(DISK_FILES).length + 8)
    expect(lines[3]).toMatch(/^mkdir -p "\$\(dirname '\/tmp\/kf-disk\/logbook.txt'\)" && echo \S+ \| base64 -d > /)
    expect(lines).toContain(
      'mkdir -p /tmp/kf-disk/boot && cp /boot/vmlinuz-virt /boot/initramfs-virt /tmp/kf-disk/boot/'
    )
    const install = lines.find((line) => line.includes('grub-install')) ?? ''
    expect(install).toContain('grub-install --target=i386-pc --boot-directory=/mnt/boot')
    expect(install).toMatch(/ \/dev\/sda && cp -a \/mnt\/boot\/grub\/\. \/tmp\/kf-disk\/boot\/grub\/ && umount \/mnt$/)
    const mkfs = lines.at(-1) ?? ''
    expect(mkfs).toContain('E2FSPROGS_FAKE_TIME=')
    expect(mkfs).toMatch(
      /mke2fs -q -F -t ext4 -L kernelfall -U \S+ -E hash_seed=\S+,root_owner=0:0 -d \/tmp\/kf-disk \/dev\/sda1 && sync$/
    )
  })

  it("boots GRUB's one entry on the serial console with the Machine's own command line", () => {
    expect(GRUB_CFG).toMatch(/^serial --unit=0 --speed=115200\nterminal_input serial\nterminal_output serial\n/)
    expect(GRUB_CFG.match(/menuentry '[^']+'/g)).toEqual(["menuentry 'Alpine, with Linux virt'"])
    expect(GRUB_CFG).toContain(`\tlinux\t/boot/vmlinuz-virt ${VM_CMDLINE}\n`)
    expect(GRUB_CFG).toContain('\tinitrd\t/boot/initramfs-virt\n')
  })
})
