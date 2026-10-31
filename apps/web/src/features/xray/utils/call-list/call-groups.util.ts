import type {
  CallFocus,
  CallFold,
  CallFoldKind,
  CallGroup,
  CallGroupRole,
  CallOutcome,
  CallRow,
  XrayCall,
} from '@features/xray/types'
import { baseName, SHELL_PROGRAM } from '@features/xray/utils/calls'
import { signalName } from '@features/xray/utils/processes'
import type { RunEvent } from '@kernelfall/machine/hooks'
import type { TraceRun } from '@kernelfall/machine/types'
import { isFocusedCall } from './call-focus.util'
import {
  FORK_CALLS,
  MAX_CYCLE,
  MAX_SEGMENT_ROWS,
  MIN_CYCLE_REPEAT,
  MIN_FOLD,
  MIN_REPEAT,
  PATH_FOLDERS,
  PATH_LOOKUP_CALLS,
  SHELL_BOOKKEEPING_CALLS,
  START_UP_CALLS,
  SUMMARY_NAMES,
  SYNC_READ_COUNT,
  TERMINFO_CREDENTIAL_CALLS,
  TERMINFO_FOLDERS,
  TERMINFO_READ_CALLS,
} from './call-list.constants'

interface ProcessLife {
  parent: number | null
  exec: string | null
  exit: { readonly code: number; readonly signal: number | null } | null
  children: number[]
}

type Item = { readonly call: XrayCall; readonly focused: boolean }

const SIGNAL_CALLS = new Set(['rt_sigaction', 'rt_sigprocmask', 'sigaction', 'sigprocmask'])
const OUTPUT_CALLS = new Set(['write', 'writev'])
const OPEN_CALLS = new Set(['open', 'openat'])

/** The kernel's answer as strace ends a line: `= 6`, `= -1 ENOENT`, `= ?` for a call that never returned. */
export function returnText(outcome: CallOutcome): string {
  if (outcome.kind === 'returned') {
    return outcome.errno !== null ? `-1 ${outcome.errno}` : String(outcome.ret)
  }
  return outcome.kind === 'exited' ? '?' : '…'
}

function livesOf(run: TraceRun, events: readonly RunEvent[]): Map<number, ProcessLife> {
  const lives = new Map<number, ProcessLife>()
  const life = (pid: number): ProcessLife => {
    let found = lives.get(pid)
    if (!found) {
      found = { parent: null, exec: null, exit: null, children: [] }
      lives.set(pid, found)
    }
    return found
  }
  if (run.pid !== null) {
    life(run.pid)
  }
  for (const event of events) {
    switch (event.type) {
      case 'sched_process_fork':
        if (lives.has(event.parentPid)) {
          life(event.parentPid).children.push(event.childPid)
          life(event.childPid).parent = event.parentPid
        }
        break
      case 'sched_process_exec':
        if (lives.has(event.pid)) {
          life(event.pid).exec = event.filename
        }
        break
      case 'sched_process_exit':
        if (lives.has(event.pid)) {
          life(event.pid).exit = { code: event.code, signal: event.signal ?? null }
        }
        break
      default:
        break
    }
  }
  return lives
}

function fold(kind: CallFoldKind, label: string, items: readonly Item[]): CallRow {
  const calls = items.map((item) => item.call)
  const folded: CallFold = {
    key: `${kind}:${calls[0]?.id ?? 0}`,
    fold: kind,
    label,
    calls,
    focused: items.some((item) => item.focused),
  }
  return { kind: 'fold', ...folded }
}

const callRow = (item: Item): CallRow => ({ kind: 'call', call: item.call, focused: item.focused })

// bash looks for a command in each PATH folder; it stats "." first to compare it with them.
// A level that teaches the search keeps it one row, opened (callListView), not scattered.
function pathSearchEnd(items: readonly Item[], from: number): { end: number; target: string } | null {
  let target: string | null = null
  let end = from
  for (; end < items.length; end++) {
    const { call } = items[end] as Item
    if (!PATH_LOOKUP_CALLS.has(call.name) || call.path === null) {
      break
    }
    if (call.path === '.' && end === from) {
      continue
    }
    const slash = call.path.lastIndexOf('/')
    // Only <PATH folder>/<name> is the search; ncurses statting /etc/terminfo is not.
    if (slash === -1 || !PATH_FOLDERS.has(call.path.slice(0, slash) || '/')) {
      break
    }
    const name = baseName(call.path)
    target ??= name
    if (name !== target) {
      break
    }
  }
  return target !== null && end - from >= MIN_FOLD ? { end, target } : null
}

const isTerminfoPath = (path: string | null): boolean =>
  path?.split('/').some((part) => TERMINFO_FOLDERS.has(part)) ?? false

// readline asks ncurses for $TERM's description: it stats each terminfo folder, checks the entry, opens and reads it.
function terminfoEnd(items: readonly Item[], from: number): number | null {
  let opened = false
  let end = from
  for (; end < items.length; end++) {
    const { call, focused } = items[end] as Item
    if (focused) {
      break
    }
    if (isTerminfoPath(call.path) && (PATH_LOOKUP_CALLS.has(call.name) || OPEN_CALLS.has(call.name))) {
      opened ||= OPEN_CALLS.has(call.name)
      continue
    }
    const reads = opened && !call.path && TERMINFO_READ_CALLS.has(call.name)
    if (end === from || !(TERMINFO_CREDENTIAL_CALLS.has(call.name) || reads)) {
      break
    }
  }
  return end - from >= MIN_FOLD ? end : null
}

function nextNonSignal(items: readonly Item[], from: number): XrayCall | undefined {
  return items.slice(from).find((item) => !SIGNAL_CALLS.has(item.call.name))?.call
}

function isBookkeeping(items: readonly Item[], at: number): boolean {
  const { call, focused } = items[at] as Item
  if (focused) {
    return false
  }
  if (SHELL_BOOKKEEPING_CALLS.has(call.name)) {
    return true
  }
  if (call.name === 'pipe' || call.name === 'pipe2') {
    // The pipe a pipeline needs is the lesson; only the one right before the fork is the sync pipe.
    const next = nextNonSignal(items, at + 1)
    return next !== undefined && FORK_CALLS.has(next.name)
  }
  return call.name === 'read' && call.args[2]?.value === String(SYNC_READ_COUNT)
}

function sameCycle(items: readonly Item[], a: number, b: number, length: number): boolean {
  for (let i = 0; i < length; i++) {
    if (items[a + i]?.call.name !== items[b + i]?.call.name) {
      return false
    }
  }
  return true
}

// Calls that repeat, alone or as a short cycle (open, read, close per file), fold into "× n".
function foldRepeats(items: readonly Item[]): CallRow[] {
  const rows: CallRow[] = []
  let i = 0
  while (i < items.length) {
    let best: { length: number; times: number } | null = null
    for (let length = 1; length <= MAX_CYCLE && i + length <= items.length; length++) {
      let times = 1
      while (i + (times + 1) * length <= items.length && sameCycle(items, i, i + times * length, length)) {
        times++
      }
      const enough = times >= (length === 1 ? MIN_REPEAT : MIN_CYCLE_REPEAT)
      if (enough && (best === null || times * length > best.times * best.length)) {
        best = { length, times }
      }
    }
    if (best === null) {
      rows.push(callRow(items[i] as Item))
      i++
      continue
    }
    const span = items.slice(i, i + best.length * best.times)
    const names = span.slice(0, best.length).map((item) => item.call.name)
    rows.push(fold('repeat', `${names.join(', ')} × ${best.times}`, span))
    i += span.length
  }
  return rows
}

function summaryLabel(calls: readonly XrayCall[]): string {
  const counts = new Map<string, number>()
  for (const call of calls) {
    counts.set(call.name, (counts.get(call.name) ?? 0) + 1)
  }
  const names = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
  const more = names.length - SUMMARY_NAMES
  return `${names.slice(0, SUMMARY_NAMES).join(', ')}${more > 0 ? ` and ${more} more` : ''}`
}

// A long stretch of a program's own work (find walking /) is one row; what the level teaches stays out.
function condense(rows: readonly CallRow[]): CallRow[] {
  if (rows.length <= MAX_SEGMENT_ROWS) {
    return [...rows]
  }
  const out: CallRow[] = []
  let run: CallRow[] = []
  const flush = () => {
    if (run.length >= MIN_FOLD) {
      const calls = run.flatMap((row) => (row.kind === 'call' ? [row.call] : row.calls))
      out.push(
        fold(
          'summary',
          summaryLabel(calls),
          calls.map((call) => ({ call, focused: false }))
        )
      )
    } else {
      out.push(...run)
    }
    run = []
  }
  for (const row of rows) {
    if (!row.focused && (row.kind === 'call' || row.fold === 'repeat')) {
      run.push(row)
    } else {
      flush()
      out.push(row)
    }
  }
  flush()
  return out
}

function shellRows(items: readonly Item[], shell: string): CallRow[] {
  const rows: CallRow[] = []
  let loose: Item[] = []
  const flush = () => {
    rows.push(...foldRepeats(loose))
    loose = []
  }
  let i = 0
  while (i < items.length) {
    const search = pathSearchEnd(items, i)
    if (search) {
      flush()
      rows.push(fold('path-search', `looks up ${search.target} in PATH`, items.slice(i, search.end)))
      i = search.end
      continue
    }
    const terminfo = terminfoEnd(items, i)
    if (terminfo !== null) {
      flush()
      rows.push(fold('terminfo', "reads the terminal's description (terminfo)", items.slice(i, terminfo)))
      i = terminfo
      continue
    }
    let end = i
    while (end < items.length && isBookkeeping(items, end)) {
      end++
    }
    if (end - i >= MIN_FOLD) {
      flush()
      rows.push(fold('bookkeeping', `${shell}'s bookkeeping`, items.slice(i, end)))
      i = end
      continue
    }
    loose.push(items[i] as Item)
    i++
  }
  flush()
  return rows
}

function programRows(items: readonly Item[], afterExec: boolean): CallRow[] {
  let end = 0
  if (afterExec) {
    while (end < items.length && !items[end]?.focused && START_UP_CALLS.has(items[end]?.call.name ?? '')) {
      end++
    }
  }
  const startUp = end >= MIN_FOLD ? [fold('start-up', 'start-up', items.slice(0, end))] : []
  return [...startUp, ...foldRepeats(items.slice(startUp.length > 0 ? end : 0))]
}

// A process changes program at a working execve; toXrayCalls already names each call's program.
function rowsOf(items: readonly Item[]): CallRow[] {
  const rows: CallRow[] = []
  let from = 0
  while (from < items.length) {
    const program = items[from]?.call.program
    let to = from
    while (to < items.length && items[to]?.call.program === program) {
      to++
    }
    const segment = items.slice(from, to)
    const before = items[from - 1]?.call
    const afterExec = before?.name === 'execve' && before.outcome.kind === 'returned' && before.outcome.errno === null
    rows.push(...condense(program === SHELL_PROGRAM ? shellRows(segment, program) : programRows(segment, afterExec)))
    from = to
  }
  return rows
}

function exitFact(exit: ProcessLife['exit']): string[] {
  if (exit === null) {
    return []
  }
  return [exit.signal !== null ? `killed by ${signalName(exit.signal)}` : `exit ${exit.code}`]
}

function forkFact(children: readonly number[]): string[] {
  if (children.length === 0) {
    return []
  }
  return [`fork → ${children.length === 1 ? 'PID' : 'PIDs'} ${children.join(', ')}`]
}

function roleOf(pid: number, root: number | null, life: ProcessLife): CallGroupRole {
  if (life.exec !== null) {
    return 'program'
  }
  return pid === root ? 'shell' : 'subshell'
}

function titleOf(role: CallGroupRole, program: string, pid: number): string {
  switch (role) {
    case 'shell':
      return `the shell (${program}, PID ${pid})`
    case 'program':
      return `the program (${program}, PID ${pid})`
    case 'subshell':
      return `a copy of the shell (${program}, PID ${pid})`
  }
}

/** The run's calls by the process that made them, the shell first, with the noise folded into counted rows. */
export function callGroupsOf(
  run: TraceRun,
  calls: readonly XrayCall[],
  events: readonly RunEvent[],
  focus: CallFocus
): readonly CallGroup[] {
  const lives = livesOf(run, events)
  const byPid = new Map<number, XrayCall[]>()
  for (const call of calls) {
    const mine = byPid.get(call.pid)
    if (mine) {
      mine.push(call)
    } else {
      byPid.set(call.pid, [call])
    }
  }
  const pids = [...new Set([...(run.pid !== null ? [run.pid] : []), ...byPid.keys()])].filter((pid) => byPid.has(pid))

  const groups = pids.map((pid): Omit<CallGroup, 'open'> => {
    const life = lives.get(pid) ?? { parent: null, exec: null, exit: null, children: [] }
    const mine = byPid.get(pid) ?? []
    const role = roleOf(pid, run.pid, life)
    const program = life.exec !== null ? baseName(life.exec) : (mine[0]?.program ?? SHELL_PROGRAM)
    const items = mine.map((call) => ({ call, focused: isFocusedCall(call, program, focus) }))
    const facts = [
      ...(life.parent !== null ? [`forked by PID ${life.parent}`] : []),
      ...(life.exec !== null ? [`execve ${life.exec}`] : []),
      ...forkFact(life.children),
      ...exitFact(life.exit),
    ]
    return {
      key: `pid:${pid}`,
      pid,
      role,
      title: titleOf(role, program, pid),
      facts,
      count: mine.length,
      rows: rowsOf(items),
      focused: items.some((item) => item.focused),
      focusedCalls: items.filter((item) => item.focused).map((item) => item.call),
    }
  })

  // The lesson's processes open; without one, the programs do and the shell's side waits a click away.
  const anyFocus = groups.some((group) => group.focused)
  return groups.map((group) => ({
    ...group,
    open: anyFocus ? group.focused : group.role !== 'shell' || groups.length === 1,
  }))
}

/** The call the drawing starts on: the lesson's first output, else its first call; null without a focus. */
export function leadCallId(groups: readonly CallGroup[]): number | null {
  const focused = lessonCalls(groups)
  return (focused.find((call) => OUTPUT_CALLS.has(call.name)) ?? focused[0])?.id ?? null
}

/** Every call the level teaches, in the order they were made. */
export function lessonCalls(groups: readonly CallGroup[]): readonly XrayCall[] {
  return groups.flatMap((group) => group.focusedCalls).sort((a, b) => a.id - b.id)
}
