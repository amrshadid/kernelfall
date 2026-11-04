import type { XrayCall } from '@features/xray/types'
import { toXrayCalls } from '@features/xray/utils/calls'
import { xrayContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { recordedCommand } from '@/test/fixtures/recorded-runs.fixture'
import { runOf } from '@/test/fixtures/trace-events.fixture'
import { NO_BREAK } from './crossing.constants'
import { crossingParts, crossingStoryboard, requestText } from './crossing.util'

/** No-break spaces shown as ~, so the tests can see where the card may not wrap. */
const marked = (text: string) => text.replaceAll(NO_BREAK, '~')

const content = xrayContent()
// P.3's recording runs the same BusyBox /bin/echo the P.2 chip does.
const P3 = 'prologue-boot-path-03-speak-to-shell'
const P2 = 'prologue-boot-path-02-first-words'
const ECHO = '/bin/echo one two three four'
const GCC = 'gcc -Wall -Wextra hello.c -o hello && ./hello'

async function recordedCall(
  level: string,
  run: string,
  commandLine: string,
  pick: (call: XrayCall) => boolean
): Promise<XrayCall> {
  const { events } = await recordedCommand(level, run, commandLine)
  const call = toXrayCalls(runOf(events, commandLine), events, content).find(pick)
  if (!call) {
    throw new Error(`${level}/${run}: no such call`)
  }
  return call
}

const echoCall = (name: string) => recordedCall(P3, 'solution', ECHO, (c) => c.program === 'echo' && c.name === name)

describe('crossingStoryboard on the write P.2 teaches', () => {
  it('crosses in five beats: ask, the Gate, the kernel, the terminal, the answer', async () => {
    const board = crossingStoryboard(await echoCall('write'), content.narration)
    expect(board.stages.map((s) => s.tick)).toEqual(['ask', 'the Gate', 'kernel', 'terminal', 'answer'])
    expect(board.stages.map((s) => s.scene.beat)).toEqual(['ask', 'gate', 'kernel', 'device', 'answer'])
  })

  it('says each beat in one plain sentence, with the real numbers', async () => {
    const board = crossingStoryboard(await echoCall('write'), content.narration)
    expect(board.stages.map((s) => s.what)).toEqual([
      "`echo` can't touch your terminal itself, so it asks the kernel: write these 19 bytes to fd 1.",
      "The request crosses the Gate: the CPU switches to kernel mode, where only the kernel's code runs.",
      'The kernel finds that fd 1 is your terminal and hands the 19 bytes to its driver, the tty driver.',
      'The bytes reach the terminal: `one two three four` appears on the screen.',
      'The answer comes back up through the Gate: 19, all 19 bytes taken.',
    ])
    expect(board.stages[0]?.title).toBe('echo asks the kernel')
  })

  it('keeps the entry path, registers and pt_regs for Deep', async () => {
    const board = crossingStoryboard(await echoCall('write'), content.narration)
    const said = board.stages.map((s) => `${s.title} ${s.what}`).join(' ')
    for (const deep of ['eax', 'int $0x80', 'pt_regs', 'iret', 'register', 'ring', 'entry_INT80_32']) {
      expect(said).not.toContain(deep)
    }
  })

  it('carries the request in plain words and lights the tty driver, under the VFS', async () => {
    const call = await echoCall('write')
    expect(marked(requestText(call))).toBe('write 19~bytes to fd~1 (your terminal)')
    expect(crossingParts(call)).toEqual([
      { id: 'vfs', name: 'VFS and filesystems', detail: 'fs/', served: false },
      { id: 'drivers', name: 'Devices and drivers', detail: 'tty driver', served: true },
    ])
    const board = crossingStoryboard(call, content.narration)
    expect(board.terminal).toBe('one two three four\n')
    expect(board.answer).toEqual({ value: '19', meaning: 'all 19 bytes taken' })
  })

  it('pauses for a guess only before the answer, with choices from the call', async () => {
    const board = crossingStoryboard(await echoCall('write'), content.narration)
    expect(board.stages.filter((s) => s.predict).map((s) => s.key)).toEqual(['answer'])
    expect(board.stages.at(-1)?.predict).toMatchObject({
      question: 'What will the kernel answer?',
      options: ['-1', '0', '1', '19'],
      answer: '19',
    })
  })
})

describe('crossingStoryboard on other recorded calls', () => {
  it('a statx that finds nothing: no device beat, a refusal, and -1 to guess', async () => {
    const call = await recordedCall(
      P2,
      'broken',
      GCC,
      (c) => c.name === 'statx' && c.outcome.kind === 'returned' && c.outcome.errno === 'ENOENT'
    )
    const board = crossingStoryboard(call, content.narration)
    expect(board.stages.map((s) => s.scene.beat)).toEqual(['ask', 'gate', 'kernel', 'answer'])
    expect(board.request).toBe(call.desk)
    expect(board.parts).toEqual([{ id: 'vfs', name: 'VFS and filesystems', detail: 'fs/', served: true }])
    expect(board.stages[2]?.what).toBe('The kernel tries, and stops: no such file or directory.')
    expect(board.stages[3]?.what).toBe(
      'The answer comes back up: -1, refused. The C library sets `errno` to `ENOENT`: no such file or directory.'
    )
    expect(board.stages[3]?.predict).toMatchObject({ options: ['-1', '0'], answer: '-1' })
    expect(board.answer).toEqual({ value: '-1', meaning: 'ENOENT' })
  })

  it('execve: nothing comes back to the old program, so there is nothing to guess', async () => {
    const execve = await recordedCall(P3, 'solution', ECHO, (c) => c.name === 'execve' && c.path === '/bin/echo')
    const board = crossingStoryboard(execve, content.narration)
    expect(board.stages.at(-1)?.what).toBe('No answer comes back to the old program: this process now runs `echo`.')
    expect(board.stages.some((s) => s.predict)).toBe(false)
    expect(board.parts.find((p) => p.served)?.id).toBe('processes')
  })

  it('exit_group: the process is gone, no answer', async () => {
    const board = crossingStoryboard(await echoCall('exit_group'), content.narration)
    expect(board.stages.map((s) => s.scene.beat)).toEqual(['ask', 'gate', 'kernel', 'answer'])
    expect(board.stages[2]?.what).toBe('The work happens in Processes and signals: the kernel ends the process.')
    expect(board.answer).toEqual({ value: 'none', meaning: 'the process is gone' })
    expect(board.stages.some((s) => s.predict)).toBe(false)
  })

  it('a call X-ray has no part for is only "the kernel"', async () => {
    const call = await echoCall('set_tid_address')
    expect(crossingParts(call)).toEqual([
      { id: null, name: 'The kernel', detail: call.kernelPath.at(-1), served: true },
    ])
    expect(crossingStoryboard(call, content.narration).stages[2]?.what).toMatch(/^The kernel does the work: it /)
  })

  it('names the file a write goes to, and the filesystem its route names', async () => {
    const call = await echoCall('write')
    const toFile = { ...call, console: null }
    expect(marked(requestText(toFile, '/tmp/out'))).toBe('write 19~bytes to fd~1 (/tmp/out)')
    expect(crossingParts(toFile, { kind: 'fs', fs: 'ext4', fn: 'ext4_file_write_iter' })).toEqual([
      { id: 'vfs', name: 'VFS and filesystems', detail: 'ext4', served: true },
    ])
  })
})
