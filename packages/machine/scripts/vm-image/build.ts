// Builds the Linux image the game's VM boots: Alpine x86 with gcc, from pinned packages.
// Usage: pnpm vm:image [--update] [--mirror-out <dir>] [--out <dir>]
//   --update             re-pins versions and checksums in vm-image.lock.json
//   --mirror-out <dir>   also writes every pinned download there, flat, for the mirror release
//   --out <dir>          writes the image there instead of apps/web/public/vm
// Downloads fall back to the mirror (KF_VM_MIRROR, default DEFAULT_MIRROR) when upstream lacks them.
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import { SHADOW_GID } from '#types/definitions/cred'
import { VM_CMDLINE, VM_DISK_FILE, VM_HOME, VM_PLAYER } from '#types/definitions/vm'
import { indexFromApkIndex, installedNames, type PackageIndex, parseIndex, resolve, sha256 } from '#vm-image/alpine'
import { type ArchiveEntry, readTarGz, writeCpioGz } from '#vm-image/archive'
import { buildDisk } from '#vm-image/disk'
import {
  CONTROL,
  guestDir,
  guestFile,
  INIT,
  INITTAB,
  MOTD,
  PLAYER_GROUP,
  PLAYER_PASSWD,
  PLAYER_SHADOW,
  PROFILE,
  RC,
  SHELL,
  TRACE,
} from '#vm-image/guest-files'
import { fetchPinnedFile, mirrorBase, writeMirror } from '#vm-image/mirror'
import { mergeTree, writeV86Fs } from '#vm-image/v86-fs'

const ALPINE = 'https://dl-cdn.alpinelinux.org/alpine/v3.24'
const MINIROOTFS = 'alpine-minirootfs-3.24.3-x86.tar.gz'
const KERNEL_PACKAGE = 'linux-virt'
// e2fsprogs makes the data disk's ext4 (disk.ts), and gives the player mkfs, fsck and debugfs.
// BusyBox has no man pages of its own: coreutils-doc's GNU pages are what a real distribution shows.
const PACKAGES = [
  'bash',
  'gcc',
  'musl-dev',
  'strace',
  'tcc',
  'tcc-libs-static',
  'tcc-dev',
  'busybox-static',
  'file',
  'e2fsprogs',
  'mandoc',
  'man-pages',
  'coreutils-doc',
  'pciutils',
  'dtc',
  'runuser',
  'setpriv',
  'lscpu',
  'lsblk',
  // On the data disk, for the boot levels (disk.ts).
  'grub',
  'grub-bios',
]
// grub wants mkinitfs; this build makes the initramfs itself.
const NOT_INSTALLED = ['initramfs-generator']
// modules.dep order: each one after what it needs. sd_mod: /dev/sda in a stuck boot's shell.
const INITRAMFS_MODULES = ['fs/netfs/netfs', 'net/9p/9pnet', 'net/9p/9pnet_virtio', 'fs/9p/9p', 'drivers/scsi/sd_mod']
const INITRAMFS_PATH = 'boot/initramfs-virt'
const V86_COMMIT = '94faf3d6b19ecabc53a4010aaa24252fa6a162e2'
const BIOS = ['seabios.bin', 'vgabios.bin']

interface Lock {
  minirootfs: string
  bios: Record<string, string>
  packages: Record<string, { version: string; sha256: string }>
}

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '../../../..')
const outAt = process.argv.indexOf('--out')
if (outAt !== -1 && !process.argv[outAt + 1]) {
  throw new Error('--out needs a directory')
}
const out = outAt === -1 ? join(repo, 'apps/web/public/vm') : resolvePath(process.argv[outAt + 1] ?? '')
const cache = join(repo, 'node_modules/.cache/kernelfall-vm')
const lockPath = join(here, 'vm-image.lock.json')
const update = process.argv.includes('--update')
const lock: Lock = existsSync(lockPath)
  ? JSON.parse(readFileSync(lockPath, 'utf8'))
  : { minirootfs: '', bios: {}, packages: {} }
let lockChanged = update
const mirror = mirrorBase()
const mirrorOutAt = process.argv.indexOf('--mirror-out')
const mirrorOut = mirrorOutAt === -1 ? null : process.argv[mirrorOutAt + 1]
if (mirrorOutAt !== -1 && !mirrorOut) {
  throw new Error('--mirror-out needs a directory')
}
/** Every pinned file this build used, by name: what --mirror-out writes. */
const downloads = new Map<string, Uint8Array>()

/** A download must match the lock; with --update the lock takes the new checksum. */
function pinned(what: string, data: Uint8Array, expected: string | undefined, record: (hash: string) => void) {
  const actual = sha256(data)
  if (expected === actual) {
    return
  }
  if (!update) {
    throw new Error(`${what}: checksum ${actual} does not match the lock (${expected ?? 'none'}); run with --update`)
  }
  record(actual)
}

async function main() {
  const index: PackageIndex = { packages: new Map(), provides: new Map() }
  for (const section of ['main', 'community']) {
    // The index changes as Alpine updates, so it is fetched fresh, never cached.
    const response = await fetch(`${ALPINE}/${section}/x86/APKINDEX.tar.gz`)
    parseIndex(indexFromApkIndex(new Uint8Array(await response.arrayBuffer())), section, index)
  }

  const fetchPinned = async (url: string, name: string) => {
    const data = await fetchPinnedFile(url, name, cache, mirror)
    downloads.set(name, data)
    return data
  }

  const rootfsArchive = await fetchPinned(`${ALPINE}/releases/x86/${MINIROOTFS}`, MINIROOTFS)
  pinned(MINIROOTFS, rootfsArchive, lock.minirootfs, (hash) => {
    lock.minirootfs = hash
  })
  const rootfs = readTarGz(rootfsArchive)

  const kernelPackage = index.packages.get(KERNEL_PACKAGE)
  if (!kernelPackage) {
    throw new Error(`Alpine has no ${KERNEL_PACKAGE}`)
  }
  // Without the kernel's own dependencies (mkinitfs, kmod): they build initramfs images on a real install; ours is made here.
  const skipped = new Set([...installedNames(rootfs), ...NOT_INSTALLED])
  const wanted = [...resolve(PACKAGES, index, skipped), kernelPackage]
  const packages: ArchiveEntry[][] = []
  for (const found of wanted) {
    const locked = lock.packages[found.name]
    // The lock's version wins: once Alpine has replaced it, the mirror still has it.
    const version = locked && !update ? locked.version : found.version
    if (version !== found.version) {
      console.log(`${found.name}: Alpine now has ${found.version}; building the pinned ${version}`)
    }
    const file = `${found.name}-${version}.apk`
    const data = await fetchPinned(`${ALPINE}/${found.repo}/x86/${file}`, file)
    if (!locked) {
      // A package new to the build is pinned as it is first fetched; the others keep their pins.
      lock.packages[found.name] = { version, sha256: sha256(data) }
      lockChanged = true
      console.log(`pinned new package ${file}`)
    } else {
      pinned(file, data, locked.version === version ? locked.sha256 : undefined, (hash) => {
        lock.packages[found.name] = { version, sha256: hash }
      })
    }
    packages.push(readTarGz(data))
  }
  console.log(`${wanted.length} packages: ${wanted.map((found) => found.name).join(' ')}`)

  const kernelRelease = packages
    .flat()
    .find((entry) => /^lib\/modules\/[^/]+\/modules\.dep$/.test(entry.path))
    ?.path.split('/')[2]
  if (!kernelRelease) {
    throw new Error(`${KERNEL_PACKAGE} has no lib/modules/<release>/modules.dep`)
  }

  const rootfsText = (path: string) => new TextDecoder().decode(rootfs.find((entry) => entry.path === path)?.data)
  const tree = mergeTree([
    rootfs,
    ...packages,
    [
      guestFile('etc/inittab', INITTAB),
      guestFile('etc/kf-rc', RC, 0o755),
      guestFile('usr/libexec/kf-shell', SHELL, 0o755),
      guestFile('usr/sbin/kf-trace', TRACE, 0o755),
      guestFile('usr/sbin/kf-control', CONTROL, 0o755),
      guestFile('etc/profile.d/kernelfall.sh', PROFILE),
      guestFile('etc/hostname', 'kernelfall\n'),
      guestFile('etc/motd', MOTD),
      guestFile('etc/shells', `${rootfsText('etc/shells')}/bin/bash\n`),
      guestFile('etc/passwd', rootfsText('etc/passwd') + PLAYER_PASSWD),
      guestFile('etc/group', rootfsText('etc/group') + PLAYER_GROUP),
      { ...guestFile('etc/shadow', rootfsText('etc/shadow') + PLAYER_SHADOW, 0o640), gid: SHADOW_GID },
      guestDir(VM_HOME, VM_PLAYER.uid, VM_PLAYER.gid),
    ],
  ])

  const fileOf = (path: string) => {
    const entry = tree.get(path)
    if (!entry) {
      throw new Error(`the image has no ${path}`)
    }
    return entry.data
  }
  const kernel = fileOf('boot/vmlinuz-virt')
  const initramfs = writeCpioGz([
    ...['bin', 'dev', 'lib', 'proc', 'sys', 'newroot'].map((path) => ({ path, mode: 0o40755, data: new Uint8Array() })),
    { path: 'bin/busybox', mode: 0o100755, data: fileOf('bin/busybox.static') },
    { path: 'init', mode: 0o100755, data: new TextEncoder().encode(INIT) },
    ...INITRAMFS_MODULES.map((module) => ({
      path: `lib/${module.split('/').pop()}.ko`,
      mode: 0o100644,
      data: gunzipSync(fileOf(`lib/modules/${kernelRelease}/kernel/${module}.ko.gz`)),
    })),
  ])
  // Where mkinitfs puts it; disk.ts copies it for GRUB.
  tree.set(INITRAMFS_PATH, { ...guestFile(INITRAMFS_PATH, ''), data: initramfs })

  // Built aside, then moved to vm/<version>/: only manifest.json keeps a fixed name.
  rmSync(out, { recursive: true, force: true })
  const image = join(out, 'next')
  mkdirSync(join(image, 'bios'), { recursive: true })
  const { files, bytes } = writeV86Fs(tree, image)
  writeFileSync(join(image, 'vmlinuz'), kernel)
  writeFileSync(join(image, 'initramfs.cpio.gz'), initramfs)

  for (const name of BIOS) {
    const data = await fetchPinned(`https://raw.githubusercontent.com/copy/v86/${V86_COMMIT}/bios/${name}`, name)
    pinned(name, data, lock.bios[name], (hash) => {
      lock.bios[name] = hash
    })
    writeFileSync(join(image, 'bios', name), data)
  }

  const disk = await buildDisk(image, join(dirname(fileURLToPath(import.meta.resolve('v86'))), 'v86.wasm'))
  writeFileSync(join(image, VM_DISK_FILE), disk)

  // The saved boot state belongs to one image and one command line: either changing boots fresh.
  const version = sha256(
    Buffer.concat([readFileSync(join(image, 'fs.json')), kernel, initramfs, disk, Buffer.from(VM_CMDLINE)])
  ).slice(0, 12)
  renameSync(image, join(out, version))
  writeFileSync(join(out, 'manifest.json'), JSON.stringify({ version, kernelRelease }, null, 2))
  if (lockChanged) {
    writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`)
  }
  if (mirrorOut) {
    writeMirror(mirrorOut, downloads)
    console.log(`mirror: ${downloads.size} files and SHA256SUMS in ${mirrorOut}`)
  }
  console.log(
    `image ${version}: kernel ${kernelRelease}, ${files} files (${(bytes / 1e6).toFixed(0)} MB raw) in ${out}`
  )
}

await main()
