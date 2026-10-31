import { toXrayCalls } from '@features/xray/utils/calls'
import { unfilledPlaceholders, xrayContent } from '@kernelfall/levels/utils'
import type { RunEvent } from '@kernelfall/machine/hooks'
import { describe, expect, it } from 'vitest'
import { bytes, ECHO, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { syscallStoryboard } from './syscall-stages.util'

const content = xrayContent()

const callsOf = (events: RunEvent[], commandLine = 'echo hello') =>
  toXrayCalls(runOf(events, commandLine), events, content)

describe('syscallStoryboard', () => {
  const ticks = (events: RunEvent[], index = 0) => {
    const call = callsOf(events)[index]
    if (!call) {
      throw new Error('no call')
    }
    return syscallStoryboard(call, content.narration)
  }

  it('takes a write to the screen through all ten stages of the drawing', () => {
    const board = ticks(ECHO)
    expect(board.stages.map((s) => s.tick)).toEqual([
      'write()',
      'registers',
      'int $0x80',
      'entry',
      'dispatch',
      'fd 1',
      'copy',
      'driver',
      'return',
      'iret',
    ])
    expect(board.path).toEqual([
      'entry_INT80_32',
      'do_int80_syscall_32',
      'ia32_sys_call',
      '__ia32_sys_write',
      'ksys_write',
      'vfs_write',
      'tty_write',
      'iterate_tty_write',
      'n_tty_write',
    ])
  })

  it('crosses into ring 0 at int $0x80 and back to ring 3 at iret', () => {
    const rings = ticks(ECHO).stages.map((s) => s.scene.ring)
    expect(rings).toEqual([3, 3, 0, 0, 0, 0, 0, 0, 0, 3])
  })

  it('fills the drawing in order: registers, pt_regs, the copy, the screen, the answer', () => {
    const scenes = ticks(ECHO).stages.map((s) => s.scene)
    const first = (flag: 'loaded' | 'saved' | 'copied' | 'printed' | 'answered' | 'back') =>
      scenes.findIndex((scene) => scene[flag])
    expect([
      first('loaded'),
      first('saved'),
      first('copied'),
      first('printed'),
      first('answered'),
      first('back'),
    ]).toEqual([1, 3, 6, 7, 8, 9])
    expect(scenes.at(-1)?.reached).toBe(9)
  })

  it('asks for a guess before the answer, with the real return value among the options', () => {
    const answer = ticks(ECHO).stages.find((s) => s.key === 'answer')
    expect(answer?.predict).toMatchObject({ answer: '6' })
    expect(answer?.predict?.options).toContain('6')
    expect(answer?.predict?.options).toHaveLength(4)
  })

  it('stops a write to a closed fd at the fd table: no copy, no driver', () => {
    const events = stamp([
      { type: 'sys_enter', pid: 2, nr: 1, name: 'write', args: [7, 0x10000, 3], data: bytes('hi\n') },
      { type: 'sys_exit', pid: 2, nr: 1, name: 'write', ret: -9 },
    ])
    const board = ticks(events)
    expect(board.stages.map((s) => s.tick)).toEqual([
      'write()',
      'registers',
      'int $0x80',
      'entry',
      'dispatch',
      'fd 7',
      'return',
      'iret',
    ])
    expect(board.stages[5]?.title).toBe('No open file at fd 7')
    expect(board.stages.find((s) => s.key === 'answer')?.predict?.answer).toBe('-1')
  })

  it('never brings exit_group back up, and asks what it returns', () => {
    const board = ticks(ECHO, 1)
    expect(board.stages.map((s) => s.tick)).toEqual([
      'exit_group()',
      'registers',
      'int $0x80',
      'entry',
      'dispatch',
      'do_exit',
      '= ?',
    ])
    expect(board.stages.every((s, i) => i < 2 || s.scene.ring === 0)).toBe(true)
    expect(board.stages.at(-1)?.predict?.answer).toBe('It never returns')
  })

  it('puts real values in every stage: the number, the fd, the count', () => {
    const text = ticks(ECHO)
      .stages.map((s) => s.what)
      .join(' ')
    expect(text).toContain('The syscall number for `write`, 1, goes in `eax`')
    expect(text).toContain('`fdget_pos(1)`')
    expect(text).toContain('copies the 6 bytes from your buffer at `0x10000`')
    expect(text).toContain('`__ia32_sys_write` returns 6, the number of bytes written')
  })

  it('shows what the kernel is doing at each step on the desk', () => {
    const desks = ticks(ECHO).stages.map((s) => s.scene.desk)
    expect(desks[2]).toEqual({
      fn: 'entry_INT80_32',
      say: 'The Gate opens: ring 3 → ring 0',
      file: 'arch/x86/entry/entry_32.S',
    })
    expect(desks[5]?.say).toBe("fd 1 → the terminal's struct file")
    expect(desks[7]?.say).toBe('The screen draws: hello')
    expect(desks[8]?.say).toBe('The answer, 6, goes in eax')
  })

  it('tells a fork, its answer and a guess about the child PID', () => {
    const events = stamp([
      { type: 'sys_enter', pid: 2, nr: 56, name: 'clone', args: [17, 0, 0, 0, 0] },
      { type: 'sys_exit', pid: 2, nr: 56, name: 'clone', ret: 3 },
    ])
    const board = ticks(events)
    expect(board.stages[0]?.what).toContain('so a `clone` comes from a call like `posix_spawn()`')
    expect(board.stages.find((s) => s.key === 'work')?.title).toBe('copy_process makes PID 3')
    const answer = board.stages.find((s) => s.key === 'answer')
    expect(answer?.what).toContain("returns 3, the new child's PID")
    expect(answer?.predict).toMatchObject({ answer: '3', options: ['-1', '0', '2', '3'] })
  })

  it('tells a wait that found nothing, and a failed execve', () => {
    const wait = ticks(
      stamp([
        { type: 'sys_enter', pid: 2, nr: 61, name: 'wait4', args: [-1, 0, 1, 0] },
        { type: 'sys_exit', pid: 2, nr: 61, name: 'wait4', ret: 0 },
      ])
    )
    expect(wait.stages.find((s) => s.key === 'answer')?.what).toContain('returns 0: no child has changed state yet')
    const exec = ticks(
      stamp([
        { type: 'sys_enter', pid: 2, nr: 59, name: 'execve', args: [0x1000, 0, 0], data: bytes('/bin/nope') },
        { type: 'sys_exit', pid: 2, nr: 59, name: 'execve', ret: -2 },
      ])
    )
    expect(exec.stages.find((s) => s.key === 'work')?.title).toBe('execve fails: ENOENT')
    expect(exec.stages.at(-1)?.title).toBe('iret: back to user mode')
  })

  it("explains a syscall the content doesn't know with its raw arguments and entry point", () => {
    const board = ticks(
      stamp([
        { type: 'sys_enter', pid: 2, nr: 425, name: 'io_uring_setup', args: [] },
        { type: 'sys_exit', pid: 2, nr: 425, name: 'io_uring_setup', ret: 3 },
      ])
    )
    expect(board.path).toContain('__ia32_sys_io_uring_setup')
    expect(board.stages.find((s) => s.key === 'work')?.what).toContain("runs the kernel's io_uring_setup")
  })

  it('leaves no placeholder unfilled, whatever the call', () => {
    const runs = [
      ECHO,
      stamp([{ type: 'sys_enter', pid: 2, nr: 0, name: 'read', args: [0, 0x1000, 64] }]),
      stamp([
        { type: 'sys_enter', pid: 2, nr: 1, name: 'write', args: [1, 0x10000, 3], data: bytes('hi\n') },
        { type: 'sys_exit', pid: 2, nr: 1, name: 'write', ret: 2 },
      ]),
      stamp([
        { type: 'sys_enter', pid: 2, nr: 1, name: 'write', args: [1, 0x10000, 3], data: bytes('hi\n') },
        { type: 'sys_exit', pid: 2, nr: 1, name: 'write', ret: -14 },
      ]),
      stamp([
        { type: 'sys_enter', pid: 2, nr: 56, name: 'clone', args: [17, 0, 0, 0, 0] },
        { type: 'sys_exit', pid: 2, nr: 56, name: 'clone', ret: -11 },
      ]),
      stamp([
        { type: 'sys_enter', pid: 2, nr: 59, name: 'execve', args: [0x1000, 0, 0], data: bytes('/bin/ls') },
        { type: 'sys_exit', pid: 2, nr: 59, name: 'execve', ret: 0 },
      ]),
      stamp([
        { type: 'sys_enter', pid: 2, nr: 61, name: 'wait4', args: [-1, 0, 0, 0] },
        { type: 'sys_exit', pid: 2, nr: 61, name: 'wait4', ret: -10 },
      ]),
      stamp([{ type: 'sys_enter', pid: 2, nr: 60, name: 'exit', args: [3] }]),
    ]
    for (const events of runs) {
      for (const call of callsOf(events)) {
        const stages = syscallStoryboard(call, content.narration).stages
        const texts = stages.flatMap((s) => [
          s.tick,
          s.title,
          s.what,
          s.why,
          s.deeper,
          s.gate ?? '',
          s.scene.desk.say,
          ...(s.predict ? [s.predict.question, s.predict.explain] : []),
        ])
        expect(texts.flatMap(unfilledPlaceholders), call.name).toEqual([])
      }
    }
  })
})
