import type { CallOutcome, RouteBelow, RoutePart, RouteRow, RouteView, XrayCall } from '@features/xray/types'
import { SECTION_PARTS, SYSCALL_PARTS } from '@features/xray/utils/section'
import type { RunEvent } from '@kernelfall/machine/hooks'
import type { CallRoute } from '@kernelfall/machine/types'
import {
  BELOW_NONE,
  DRIVER_BELOW,
  DRIVER_PARTS,
  FD_CALLS,
  FS_BELOW,
  FS_PARTS,
  NET_SYSFS_ATTRIBUTE,
  OP_OF_SYSCALL,
  OPENS,
} from './route.constants'

/** The route each call's `sys_exit` carried, by the `seq` of its `sys_enter`. */
export function routesOf(events: readonly RunEvent[]): ReadonlyMap<number, CallRoute> {
  const open = new Map<number, number[]>()
  const routes = new Map<number, CallRoute>()
  for (const event of events) {
    if (event.type === 'sys_enter') {
      open.set(event.pid, [...(open.get(event.pid) ?? []), event.seq])
    } else if (event.type === 'sys_exit') {
      // A task makes one call at a time, so its exit closes its latest enter.
      const stack = open.get(event.pid) ?? []
      const seq = stack.pop()
      if (seq !== undefined && event.route) {
        routes.set(seq, event.route)
      }
    }
  }
  return routes
}

/** The file each call worked on: its own path, or the path its fd was opened with in this run. */
export function filesOf(calls: readonly XrayCall[]): ReadonlyMap<number, string> {
  const tables = new Map<number, Map<number, string>>()
  const files = new Map<number, string>()
  for (const call of calls) {
    const ret = call.outcome.kind === 'returned' ? call.outcome.ret : null
    const table = tables.get(call.pid) ?? new Map<number, string>()
    tables.set(call.pid, table)
    if (OPENS.has(call.name) && call.path !== null) {
      files.set(call.id, call.path)
      if (ret !== null && ret >= 0) table.set(ret, call.path)
    } else if (FD_CALLS.has(call.name)) {
      const path = table.get(Number(call.args[0]?.value))
      if (path !== undefined) files.set(call.id, path)
    } else if (call.name === 'close') {
      table.delete(Number(call.args[0]?.value))
    } else if ((call.name === 'clone' || call.name === 'fork' || call.name === 'vfork') && ret !== null && ret > 0) {
      // The child starts with a copy of its parent's file table.
      tables.set(ret, new Map(table))
    }
  }
  return files
}

export function resultText(outcome: CallOutcome): string {
  if (outcome.kind !== 'returned') {
    return '= ?'
  }
  return outcome.errno === null ? `= ${outcome.ret}` : `= -1 ${outcome.errno}`
}

function partOf(route: CallRoute): RoutePart {
  if (route.kind === 'fs') {
    return FS_PARTS[route.fs]
  }
  return DRIVER_PARTS[route.driver] ?? { kind: 'driver', name: `${route.driver} driver`, source: 'drivers/' }
}

/** What the part hands the call on to; a network device's sysfs file names its own _show(). */
function belowOf(route: CallRoute, name: string, file: string | null): RouteBelow {
  const op = OP_OF_SYSCALL[name]
  if (op === undefined) {
    return BELOW_NONE
  }
  const below = (route.kind === 'fs' ? FS_BELOW[route.fs][op] : DRIVER_BELOW[route.driver]?.[op]) ?? BELOW_NONE
  const net = route.kind === 'fs' && route.fs === 'sysfs' && op === 'read' ? file?.match(NET_SYSFS_ATTRIBUTE) : null
  if (net) {
    const [, device, attribute] = net
    return {
      fns: [...below.fns, `${attribute}_show`],
      end: `${device}'s ${attribute}, kept in its struct net_device (net/core/net-sysfs.c)`,
    }
  }
  return below
}

/** A call no file served: the kernel's part that ran it, where its handler lives. */
function kernelPartOf(call: XrayCall): RoutePart {
  const id = SYSCALL_PARTS[call.name]?.[0] ?? 'syscalls'
  const part = SECTION_PARTS.find((candidate) => candidate.id === id)
  return {
    kind: 'kernel',
    name: part?.name ?? 'Syscall interface',
    source: call.sources[0]?.path ?? part?.source ?? '',
  }
}

export function routeRowOf(call: XrayCall, route: CallRoute | undefined, file: string | null): RouteRow {
  const handler = call.kernelPath.at(-1)
  const steps = [call.name, ...(handler ? [`${handler}()`] : [])]
  const shared = { id: call.id, pid: call.pid, program: call.program, text: call.text, file }
  if (!route) {
    return { ...shared, result: resultText(call.outcome), steps, part: kernelPartOf(call), end: null }
  }
  const below = belowOf(route, call.name, file)
  return {
    ...shared,
    result: resultText(call.outcome),
    steps: [...steps, `${route.fn}()`, ...below.fns.map((fn) => `${fn}()`)],
    part: partOf(route),
    end: below.end,
  }
}

/** Every call of the run with the process that made it and the part of the kernel that served it. */
export function routeOf(commandLine: string, calls: readonly XrayCall[], events: readonly RunEvent[]): RouteView {
  const routes = routesOf(events)
  const files = filesOf(calls)
  return {
    commandLine,
    rows: calls.map((call) => routeRowOf(call, routes.get(call.id), files.get(call.id) ?? null)),
  }
}
