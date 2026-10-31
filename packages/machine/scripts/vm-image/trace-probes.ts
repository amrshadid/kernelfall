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
  VM_TRACE_SPLICE_CHUNKS,
  VM_TRACE_SPLICE_GROUP,
  VM_TRACE_TTY_CHUNKS,
  VM_TRACE_WRITE_CHUNKS,
} from '#types/definitions/vm-trace'

/** A probe's definition for dynamic_events, and the filter that keeps a later chunk quiet. */
export interface TraceProbe {
  readonly name: string
  /** VM_TRACE_GROUP when absent. */
  readonly group?: string
  readonly definition: string
  readonly filter?: string
  readonly triggers?: readonly string[]
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
const event = (name: string, group = VM_TRACE_GROUP) => `${group}/${name}`

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

// include/linux/uio.h: enum iter_type, the first byte of struct iov_iter.
const ITER_BVEC = 2

// sendfile() and splice() use no user buffer. A source with no page cache (/proc, /sys) is copied
// into the pipe's pages by _copy_to_iter() from a kernel buffer, read here; it serves every read, so
// these are on only while copy_splice_read() runs. Page cache is lent and 9p's pages are filled by
// the virtio device, with no copy: those bytes are seen only on a terminal (n_tty_write).
const spliceProbes = (): TraceProbe[] => {
  const group = VM_TRACE_SPLICE_GROUP
  const data = chunks(VM_TRACE_SPLICE_CHUNKS).map((chunk) => {
    const name = `${TRACE_PROBES.splice}_${chunk}`
    const bvec = `t == ${ITER_BVEC}`
    return {
      name,
      group,
      definition: `p:${event(name, group)} _copy_to_iter n=$arg2 t=+0($arg3):u8 ${chunkWords('$arg1', chunk, false)}`,
      filter: chunk === 0 ? bvec : `${bvec} && ${after('n', chunk)}`,
    }
  })
  const toggle = (action: string) => data.map(({ name }) => `${action}:${group}:${name}`)
  const begin = `${TRACE_PROBES.splice}_begin`
  const end = `${TRACE_PROBES.splice}_end`
  return [
    ...data,
    { name: begin, group, definition: `p:${event(begin, group)} copy_splice_read`, triggers: toggle('enable_event') },
    { name: end, group, definition: `r:${event(end, group)} copy_splice_read`, triggers: toggle('disable_event') },
  ]
}

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
  ...spliceProbes(),
  ...pathProbes(),
  execveProbe,
]
