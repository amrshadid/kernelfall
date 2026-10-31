import type { SectionPartId, SectionView } from '@features/xray/types'
import type { CallRoute, TraceCall, TraceRun } from '@kernelfall/machine/types'
import {
  DRIVER_SECTION_PARTS,
  FS_SECTION_PARTS,
  PERMISSION_ERRNOS,
  SECTION_FLOORS,
  SECTION_PARTS,
  SYSCALL_PARTS,
} from './section.constants'

const decoder = new TextDecoder()

/** The extra parts a path reaches: device files go to their driver, /dev/kmsg to the kernel's log. */
function partsForPath(path: string): readonly SectionPartId[] {
  if (path === '/dev/kmsg') return ['logging']
  if (path.startsWith('/dev/')) return ['drivers']
  // sysfs is the driver model's own view of the devices.
  if (path === '/sys' || path.startsWith('/sys/')) return ['drivers']
  return []
}

/** Where one call went inside the kernel, past the syscall interface; its route says which file or device served it. */
// SIMPLIFIED: by the syscall, its path and the traced route, not by tracing each kernel function.
export function partsOfCall(
  call: Pick<TraceCall, 'name' | 'data' | 'result'>,
  route?: CallRoute
): readonly SectionPartId[] {
  const parts = new Set<SectionPartId>(['syscalls', ...(SYSCALL_PARTS[call.name] ?? [])])
  if (call.data && (call.name === 'openat' || call.name === 'open' || call.name === 'execve')) {
    for (const part of partsForPath(decoder.decode(call.data))) parts.add(part)
  }
  const served = route ? (route.kind === 'fs' ? FS_SECTION_PARTS[route.fs] : DRIVER_SECTION_PARTS[route.driver]) : []
  for (const part of served ?? ['drivers']) parts.add(part)
  if (call.result.kind === 'returned' && PERMISSION_ERRNOS.includes(-call.result.ret)) {
    parts.add('security')
  }
  return [...parts]
}

/** init's section drawing for one run: every part lit by the syscalls that passed through it. */
export function sectionOf(run: TraceRun, routes: ReadonlyMap<number, CallRoute> = new Map()): SectionView {
  const touched = new Map<SectionPartId, { calls: number; names: string[] }>()
  const touch = (id: SectionPartId, name: string) => {
    const entry = touched.get(id) ?? { calls: 0, names: [] }
    entry.calls += 1
    if (!entry.names.includes(name)) entry.names.push(name)
    touched.set(id, entry)
  }
  for (const call of run.calls) {
    // A program and the kernel working for it both run on a CPU.
    touch('programs', call.name)
    touch('cpu', call.name)
    for (const part of partsOfCall(call, routes.get(call.id))) touch(part, call.name)
  }
  return {
    total: run.calls.length,
    floors: SECTION_FLOORS.map(({ floor }) => ({
      floor,
      parts: SECTION_PARTS.filter((part) => part.floor === floor).map((part) => ({
        ...part,
        calls: touched.get(part.id)?.calls ?? 0,
        names: touched.get(part.id)?.names ?? [],
      })),
    })),
  }
}
