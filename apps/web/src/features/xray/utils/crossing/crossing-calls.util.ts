import type { XrayCall } from '@features/xray/types'
import { code } from '@features/xray/utils/narration'
import { OP_OF_SYSCALL } from '@features/xray/utils/route'
import { returnOf } from '@features/xray/utils/syscalls'
import type { TemplateValues } from '@kernelfall/levels/types'
import { fillTemplate } from '@kernelfall/levels/utils'
import { type CallRoute, SIGNAL_NAMES } from '@kernelfall/machine/types'
import { NO_BREAK } from './crossing.constants'
import {
  ACCESS,
  AT_EMPTY_PATH,
  AT_REMOVEDIR,
  CALL_SAY,
  type CallSay,
  CLONE_THREAD,
  CLONE_VFORK,
  CLONE_VM,
  DRIVER_FALLBACK,
  DRIVER_SAY,
  EXT4_SAY,
  FS_SAY,
  NULL_SAY,
  O_ACCMODE,
  O_CREAT,
  O_DIRECTORY,
  PATH_ENOENT,
  ROUTE,
  SAY_OF_SYSCALL,
  SYSLOG_ACTION_READ_ALL,
  SYSLOG_ACTION_SIZE_BUFFER,
  WNOHANG,
  WUNTRACED,
} from './crossing-calls.constants'

const WORD = 2 ** 32
const OCTAL = 8
// drivers/char/mem.c names /dev/null's handlers read_null(), write_null().
const NULL_HANDLER = /_null$/

const KIB = 1024
const MIB = KIB * KIB

/** A byte count as people say it: 16 MiB, not 16777216 bytes; the call line keeps the raw number. */
export function sizeText(count: number): string {
  if (count >= MIB && count % MIB === 0) return `${count / MIB} MiB`
  if (count >= KIB && count % KIB === 0) return `${count / KIB} KiB`
  return `${count} ${count === 1 ? 'byte' : 'bytes'}`
}

/** The trace prints registers unsigned; pids and fds read as the int the kernel sees. */
const signed = (value: number) => (value >= WORD / 2 ? value - WORD : value)

/** An argument by its name in the content, else by its place: a call the content doesn't know has only arg0, arg1… */
function argOf(call: XrayCall, name: string, index: number): number {
  const arg = call.args.find((a) => a.name === name) ?? call.args[index]
  return signed(Number(arg?.value ?? 0))
}

/** The CALL_SAY entry for this call: its own, or the variant its arguments or its answer pick. */
export function sayKeyOf(call: XrayCall): string | null {
  switch (call.name) {
    case 'clone': {
      const flags = argOf(call, 'clone_flags', 0)
      if (flags & CLONE_THREAD) return 'clone-thread'
      if (flags & CLONE_VFORK) return 'clone-vfork'
      return flags & CLONE_VM ? 'clone-vm' : 'fork'
    }
    case 'unlinkat':
      return argOf(call, 'flag', 2) & AT_REMOVEDIR ? 'rmdir' : 'unlink'
    case 'statx':
    case 'fstatat64': {
      const flags = argOf(call, call.name === 'statx' ? 'flags' : 'flag', call.name === 'statx' ? 2 : 3)
      return !call.path && flags & AT_EMPTY_PATH ? 'statx-fd' : 'statx'
    }
    case 'wait4':
      return argOf(call, 'options', 2) & WNOHANG ? 'wait4-nohang' : 'wait4'
    case 'kill':
      return argOf(call, 'sig', 1) === 0 ? 'kill-check' : 'kill'
    case 'dup2':
      return argOf(call, 'oldfd', 0) === argOf(call, 'newfd', 1) ? 'dup2-same' : 'dup2'
    case 'syslog': {
      const type = argOf(call, 'type', 0)
      if (type === SYSLOG_ACTION_SIZE_BUFFER) return 'syslog-size'
      return type === SYSLOG_ACTION_READ_ALL ? 'syslog-read' : 'syslog'
    }
    default: {
      const key = SAY_OF_SYSCALL[call.name] ?? call.name
      return key in CALL_SAY ? key : null
    }
  }
}

function childOf(upid: number): string {
  if (upid === -1) return 'a child'
  if (upid === 0) return 'a child in its process group'
  return upid > 0 ? `child ${upid}` : `a child in process group ${-upid}`
}

function whomOf(pid: number): string {
  if (pid === -1) return 'every process it may signal'
  if (pid === 0) return 'every process in its process group'
  return pid > 0 ? `PID ${pid}` : `every process in group ${-pid}`
}

/** The same, short enough for the card. */
function whomShortOf(pid: number): string {
  if (pid === -1) return 'all it may signal'
  if (pid === 0) return 'its process group'
  return pid > 0 ? `PID${NO_BREAK}${pid}` : `group${NO_BREAK}${-pid}`
}

const unitOf = (count: number) => (count === 1 ? 'byte' : 'bytes')

/** The placeholders CALL_SAY's sentences use, from the call's own arguments. */
export function sayValues(call: XrayCall): TemplateValues {
  const n = (name: string, index: number) => argOf(call, name, index)
  const flags = n('flags', 1)
  const options = n('options', 2)
  const sig = n('sig', 1)
  const count = call.buffer?.count ?? n('count', 2)
  const done = returnOf(call)
  return {
    program: call.program,
    pid: call.pid,
    fd: n('fd', 0),
    path: call.path ? code(call.path) : 'the file',
    count,
    unit: unitOf(count),
    retUnit: unitOf(done?.ret ?? 0),
    what: flags & O_DIRECTORY ? 'a folder' : 'a file',
    access: `${ACCESS[flags & O_ACCMODE] ?? ACCESS[0]}${flags & O_CREAT ? ', creating it if needed' : ''}`,
    buffers: n('vlen', 2),
    out: n('out_fd', 0),
    in: n('in_fd', 1),
    max: sizeText(n('count', 3)),
    old: n('oldfd', 0),
    new: n('newfd', 1),
    mode: `0${(n('mode', 1) & 0o7777).toString(OCTAL).padStart(3, '0')}`,
    sig,
    signal: SIGNAL_NAMES.get(sig) ?? `signal ${sig}`,
    whom: whomOf(n('pid', 0)),
    whomShort: whomShortOf(n('pid', 0)),
    child: childOf(n('upid', 0)),
    end: options & WUNTRACED ? 'end or stop' : 'end',
    ended: options & WUNTRACED ? 'ended or stopped' : 'ended',
    status: n('error_code', 0),
    dfd: n('dfd', 0),
    type: n('type', 0),
    len: n('len', 2),
    bufsiz: n('bufsiz', 2),
  }
}

export interface CallWords {
  readonly key: string
  readonly say: CallSay
  readonly values: TemplateValues
}

export function callWords(call: XrayCall): CallWords | null {
  const key = sayKeyOf(call)
  const say = key === null ? undefined : CALL_SAY[key]
  return key !== null && say ? { key, say, values: sayValues(call) } : null
}

/** Why the kernel refused, in plain words: the call's own reason, or strerror()'s. */
export function refusedText(call: XrayCall, say: CallSay | null, values: TemplateValues): string {
  const errno = returnOf(call)?.errno ?? ''
  const own = say?.refused?.[errno]
  // A missing interpreter fails execve with ENOENT too, so only a plain path walk says which name is missing.
  const reason = own ?? (errno === 'ENOENT' && call.path && call.name !== 'execve' ? PATH_ENOENT : null)
  return reason === null ? String(values.errnoMessage ?? '') : fillTemplate(reason, values)
}

/**
 * The sentence the route adds to the kernel beat: which filesystem or driver served the call. A
 * call without a route gets none, so X-ray never names a filesystem the trace didn't.
 */
export function routeText(call: XrayCall, route: CallRoute | undefined): string | null {
  if (!route) {
    return null
  }
  const op = call.name === 'sendfile64' ? 'read' : OP_OF_SYSCALL[call.name]
  if (route.kind === 'driver') {
    const nullSay = route.driver === 'mem' && NULL_HANDLER.test(route.fn) && op ? NULL_SAY[op] : undefined
    if (nullSay) {
      return nullSay
    }
    const on = DRIVER_SAY[route.driver] ?? fillTemplate(DRIVER_FALLBACK, { driver: route.driver })
    return fillTemplate(ROUTE.file, { on })
  }
  const on = FS_SAY[route.fs] ?? `on ${route.fs}`
  const lead = call.name === 'sendfile64' ? ROUTE.source : op === 'readdir' ? ROUTE.folder : ROUTE.file
  const sentence = fillTemplate(lead, { on })
  const ext4 = route.fs === 'ext4' && op ? EXT4_SAY[op] : undefined
  return ext4 ? `${sentence} ${ext4}` : sentence
}
