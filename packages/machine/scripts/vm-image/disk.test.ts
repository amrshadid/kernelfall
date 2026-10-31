import { describe, expect, it } from 'vitest'
import { blankDisk, DISK_BYTES, DISK_FILES, diskScript } from '#vm-image/disk'

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

  it('stages every file, then makes a reproducible ext4 from them on sda1', () => {
    const lines = diskScript()
    expect(lines[0]).toBe('modprobe sd_mod && until [ -b /dev/sda1 ]; do sleep 1; done')
    expect(lines[1]).toMatch(/^date -s @\d+ > \/dev\/null$/)
    expect(lines).toHaveLength(Object.keys(DISK_FILES).length + 4)
    expect(lines[3]).toMatch(/^mkdir -p "\$\(dirname '\/tmp\/kf-disk\/logbook.txt'\)" && echo \S+ \| base64 -d > /)
    const mkfs = lines.at(-1) ?? ''
    expect(mkfs).toContain('E2FSPROGS_FAKE_TIME=')
    expect(mkfs).toMatch(
      /mke2fs -q -F -t ext4 -L kernelfall -U \S+ -E hash_seed=\S+,root_owner=0:0 -d \/tmp\/kf-disk \/dev\/sda1/
    )
  })
})
