// The guest's dynamic trace events: user memory the syscall tracepoints don't print, read by probes
// whose lines the host's parser (utils/vm-trace) knows by name.
import {
  TRACE_PROBES,
  VM_TRACE_ARGV,
  VM_TRACE_CHUNK_BYTES,
  VM_TRACE_CHUNK_WORDS,
  VM_TRACE_GROUP,
  VM_TRACE_IOV_CHUNKS,
  VM_TRACE_IOVECS,
  VM_TRACE_PATH_ARGS,
  VM_TRACE_READ_CHUNKS,
  VM_TRACE_TTY_CHUNKS,
  VM_TRACE_WRITE_CHUNKS,
} from '#types/definitions/vm-trace'

/** A probe's definition for dynamic_events, and the filter that keeps a later chunk quiet. */
export interface TraceProbe {
  readonly name: string
  readonly definition: string
  readonly filter?: string
}

// i386 syscall arguments in struct pt_regs: bx, cx, dx, si, di, bp.
const REGS_ARG_OFFSETS = [0, 4, 8, 12, 16, 20]
const regsArg = (index: number) => `+${REGS_ARG_OFFSETS[index]}($arg1)`

/** One chunk of a buffer as x32 words; `user` buffers are fetched with +u, kernel ones without. */
const chunkWords = (base: string, chunk: number, user = true) =>
  Array.from(
    { length: VM_TRACE_CHUNK_WORDS },
    (_, i) => `b${i}=+${user ? 'u' : ''}${chunk * VM_TRACE_CHUNK_BYTES + i * 4}(${base}):x32`
  ).join(' ')

const chunks = (count: number) => Array.from({ length: count }, (_, chunk) => chunk)
const after = (field: string, chunk: number) => `${field} > ${chunk * VM_TRACE_CHUNK_BYTES}`
const event = (name: string) => `${VM_TRACE_GROUP}/${name}`

// read() and write() at their return: the data is in the buffer (read), and its page faulted in
// (write: a string in .rodata may not be until the kernel copies it). ksys_* get their arguments
// back with $argN at return (6.9+).
const bufferProbes = (probe: string, fn: string, count: number): TraceProbe[] =>
  chunks(count).map((chunk) => ({
    name: `${probe}_${chunk}`,
    definition: `r:${event(`${probe}_${chunk}`)} ${fn} fd=$arg1 ret=$retval:s32 ${chunkWords('$arg2', chunk)}`,
    ...(chunk > 0 && { filter: after('ret', chunk) }),
  }))

// writev()'s iovecs through the saved registers: cx is the array, dx its length; each struct iovec
// on i386 is two words, base then length.
const writevProbes = (): TraceProbe[] =>
  chunks(VM_TRACE_IOVECS).flatMap((iov) =>
    chunks(VM_TRACE_IOV_CHUNKS).map((chunk) => {
      const name = `${TRACE_PROBES.writev}_${iov}_${chunk}`
      const vec = regsArg(1)
      return {
        name,
        definition: `r:${event(name)} __ia32_sys_writev fd=${regsArg(0)}:u32 n=${regsArg(2)}:u32 ret=$retval:s32 l=+u${iov * 8 + 4}(${vec}):u32 ${chunkWords(`+u${iov * 8}(${vec})`, chunk)}`,
        filter: `n > ${iov} && ${after('l', chunk)}`,
      }
    })
  )

// What reaches the terminal, in the same stream and order as the syscalls: n_tty_write() gets the
// bytes in a kernel buffer, whoever wrote them (write, writev, or sendfile from BusyBox cat).
const ttyProbes = (): TraceProbe[] =>
  chunks(VM_TRACE_TTY_CHUNKS).map((chunk) => ({
    name: `${TRACE_PROBES.tty}_${chunk}`,
    definition: `p:${event(`${TRACE_PROBES.tty}_${chunk}`)} n_tty_write nr=$arg4 ${chunkWords('$arg3', chunk, false)}`,
    ...(chunk > 0 && { filter: after('nr', chunk) }),
  }))

// Paths at return too, through the saved registers. execve stays at entry: once it succeeds, the
// memory its arguments were in is gone.
const pathProbes = (): TraceProbe[] =>
  Object.entries(VM_TRACE_PATH_ARGS).map(([syscall, args]) => {
    const name = `${TRACE_PROBES.path}_${syscall}`
    const fields = args.map((arg, i) => `p${i}=+u0(${regsArg(arg)}):ustring`).join(' ')
    return { name, definition: `r:${event(name)} __ia32_sys_${syscall} ${fields}` }
  })

const execveProbe: TraceProbe = {
  name: TRACE_PROBES.execve,
  definition: `e:${event(TRACE_PROBES.execve)} syscalls/sys_enter_execve path=+u0($filename):ustring ${Array.from(
    { length: VM_TRACE_ARGV },
    (_, i) => `a${i}=+u0(+u${i * 4}($argv)):ustring`
  ).join(' ')}`,
}

/** Every probe the guest defines at boot. */
export const TRACE_PROBE_LIST: readonly TraceProbe[] = [
  ...bufferProbes(TRACE_PROBES.write, 'ksys_write', VM_TRACE_WRITE_CHUNKS),
  ...bufferProbes(TRACE_PROBES.read, 'ksys_read', VM_TRACE_READ_CHUNKS),
  ...writevProbes(),
  ...ttyProbes(),
  ...pathProbes(),
  execveProbe,
]
