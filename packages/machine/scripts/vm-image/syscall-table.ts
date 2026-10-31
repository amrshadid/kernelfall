// Writes the i386 syscall table the VM's kernel uses, from Linux's own syscall_32.tbl.
// Usage: pnpm vm:syscalls   (re-run only when the kernel version changes)
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cachedFetch, sha256 } from '#vm-image/alpine'

const KERNEL_TAG = 'v6.18'
const TABLE = 'arch/x86/entry/syscalls/syscall_32.tbl'
const TABLE_SHA256 = 'a3dc4002329bb8624cdaeedfad27b4d337ecd0a810e5710da1ff8cdcc52cd141'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '../../../..')
const out = join(here, '../../src/types/definitions/syscall-table.ts')

async function main() {
  const data = await cachedFetch(
    `https://raw.githubusercontent.com/torvalds/linux/${KERNEL_TAG}/${TABLE}`,
    join(repo, 'node_modules/.cache/kernelfall-vm'),
    `syscall_32-${KERNEL_TAG}.tbl`
  )
  if (sha256(data) !== TABLE_SHA256) {
    throw new Error(`${TABLE} at ${KERNEL_TAG}: checksum ${sha256(data)} is not the pinned one`)
  }
  const table = new TextDecoder()
    .decode(data)
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith('#'))
    .map((line) => line.split(/\s+/))
    .filter(([, abi]) => abi === 'i386')
  const rows = table.map(([nr, , name]) => `  ${name}: ${nr},`)
  // A syscall's tracepoint is named after its SYSCALL_DEFINE (the entry point without sys_), which
  // can differ from the name strace and the man pages use: sys_newuname is uname.
  const renamed = table.flatMap(([, , name, entry]) => {
    const tracepoint = entry?.replace(/^sys_/, '')
    return tracepoint && entry !== 'sys_ni_syscall' && tracepoint !== name ? [`  ${tracepoint}: '${name}',`] : []
  })
  writeFileSync(
    out,
    `// models ${TABLE} (Linux ${KERNEL_TAG}): written by \`pnpm vm:syscalls\`, not by hand.

/** i386 syscall numbers by name, as the VM's kernel numbers them. */
export const SYSCALL_NUMBERS: Readonly<Record<string, number>> = {
${rows.join('\n')}
}

/** Tracepoint names that differ from the syscall's own name (strace's): newuname → uname. */
export const TRACEPOINT_SYSCALLS: Readonly<Record<string, string>> = {
${renamed.join('\n')}
}
`
  )
  console.log(`${rows.length} syscalls written to ${out}`)
}

await main()
