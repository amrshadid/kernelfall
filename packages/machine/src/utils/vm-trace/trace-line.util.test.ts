import { describe, expect, it } from 'vitest'
import { parseTraceLine, signed32, traceFields } from '#utils/vm-trace/trace-line.util'

// Lines as the VM's kernel (6.18.59, i386) printed them in trace_pipe.
const LINES = {
  enter: '            bash-434     [000] .....     6.597781: sys_writev(fd: 2, vec: 0xbfc9abb8, vlen: 1)',
  exit: '            bash-434     [000] .....     6.597855: sys_writev -> 0x1',
  failed: '             cat-436     [000] .....     3.727850: sys_openat -> 0xfffffffe',
  probe:
    '            bash-441     [000] ...1.     4.968416: execve: (syscalls.sys_enter_execve) path="/bin/cat" a0="cat" a1="/etc/hostname" a2=(fault)',
  returnProbe:
    '            head-448     [000] .N...     4.500790: read: (__ia32_sys_read+0x10/0x20 <- ksys_read) fd=0x3 count=0x400 ret=0x2e6 b0=0x746f6f72 b1=0x303a783a',
  kprobe: '             cat-480     [000] .....    12.696001: tty_0: (n_tty_write+0x0/0x4e0) nr=0xb b0=0x6e72656b',
  marker: '            bash-438   [000] ...1.     4.521395: tracing_mark_write: kf-end 0',
  fork: '            bash-438     [000] .....     4.954697: sched_process_fork: comm=bash pid=438 child_comm=bash child_pid=441',
  dashed: ' kworker/0:1-events-12  [000] .....    1.000001: sched_process_free: comm=x pid=9 prio=120',
}

describe('parseTraceLine', () => {
  it('reads a syscall entry with its arguments, and its return', () => {
    expect(parseTraceLine(LINES.enter)).toEqual({
      comm: 'bash',
      pid: 434,
      cpu: 0,
      time: 6_597_781_000,
      kind: 'enter',
      name: 'writev',
      args: [2, 0xbfc9abb8, 1],
    })
    expect(parseTraceLine(LINES.exit)).toMatchObject({ kind: 'exit', name: 'writev', ret: 1 })
  })

  it('turns a 32-bit return back into -errno', () => {
    expect(parseTraceLine(LINES.failed)).toMatchObject({ kind: 'exit', name: 'openat', ret: -2 })
  })

  it("reads an eprobe's fields, keeping the quoted strings whole", () => {
    expect(parseTraceLine(LINES.probe)).toMatchObject({
      kind: 'probe',
      probe: 'execve',
      pid: 441,
      fields: { path: '/bin/cat', a0: 'cat', a1: '/etc/hostname', a2: '(fault)' },
    })
  })

  it("reads a return probe's fields", () => {
    expect(parseTraceLine(LINES.returnProbe)).toMatchObject({
      kind: 'probe',
      probe: 'read',
      pid: 448,
      fields: { fd: '0x3', count: '0x400', ret: '0x2e6', b0: '0x746f6f72', b1: '0x303a783a' },
    })
  })

  it("reads a kprobe's fields, and doesn't take a tracepoint for one", () => {
    expect(parseTraceLine(LINES.kprobe)).toMatchObject({ kind: 'probe', probe: 'tty_0', fields: { nr: '0xb' } })
    expect(parseTraceLine(LINES.fork)).toMatchObject({ kind: 'event' })
  })

  it('reads markers and other events', () => {
    expect(parseTraceLine(LINES.marker)).toMatchObject({ kind: 'marker', text: 'kf-end 0' })
    expect(parseTraceLine(LINES.fork)).toMatchObject({
      kind: 'event',
      name: 'sched_process_fork',
      fields: { pid: '438', child_pid: '441' },
    })
  })

  it("keeps a comm that has dashes of its own, and skips what isn't an event line", () => {
    expect(parseTraceLine(LINES.dashed)).toMatchObject({ comm: 'kworker/0:1-events', pid: 12 })
    expect(parseTraceLine('')).toBeNull()
    expect(parseTraceLine('CPU:0 [LOST 12 EVENTS]')).toBeNull()
  })
})

describe('signed32', () => {
  it('reads hex and decimal as 32-bit signed values', () => {
    expect(signed32('0xfffffff2')).toBe(-14)
    expect(signed32('0x6')).toBe(6)
    expect(signed32('436')).toBe(436)
  })
})

describe('traceFields', () => {
  it('unescapes quoted values', () => {
    expect(traceFields('p0="a \\"b\\"" n=0x2')).toEqual({ p0: 'a "b"', n: '0x2' })
  })
})
