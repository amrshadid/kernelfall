import { unfilledPlaceholders, xrayContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { bytes, type EventInit, FORK_EXEC_WAIT, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { processEpisodes } from './process-episode.util'
import { episodeLabel, processStoryboard } from './process-stages.util'

const { narration } = xrayContent()

// The child's exec fails, so it _exits with 127 and nobody waits: it stays a zombie.
const EXEC_FAILS: EventInit[] = [
  { type: 'sys_enter', pid: 2, nr: 56, name: 'clone', args: [17, 0, 0, 0, 0] },
  { type: 'sched_process_fork', parentPid: 2, childPid: 3 },
  { type: 'sys_exit', pid: 2, nr: 56, name: 'clone', ret: 3 },
  { type: 'sys_enter', pid: 3, nr: 59, name: 'execve', args: [0x1000, 0, 0], data: bytes('/bin/nosuch') },
  { type: 'sys_exit', pid: 3, nr: 59, name: 'execve', ret: -2 },
  { type: 'sys_enter', pid: 3, nr: 231, name: 'exit_group', args: [127] },
  { type: 'sched_process_exit', pid: 3, code: 127 },
]

const FORK_FAILS: EventInit[] = [
  { type: 'sys_enter', pid: 2, nr: 56, name: 'clone', args: [17, 0, 0, 0, 0] },
  { type: 'sys_exit', pid: 2, nr: 56, name: 'clone', ret: -11 },
]

// The child is killed by SIGKILL before it exits on its own, and init reaps it.
const KILLED: EventInit[] = [
  { type: 'sys_enter', pid: 2, nr: 56, name: 'clone', args: [17, 0, 0, 0, 0] },
  { type: 'sched_process_fork', parentPid: 2, childPid: 3 },
  { type: 'sys_exit', pid: 2, nr: 56, name: 'clone', ret: 3 },
  { type: 'sched_process_exit', pid: 3, code: 0, signal: 9 },
  { type: 'sched_process_free', pid: 3 },
]

function storyboardOf(inits: readonly EventInit[]) {
  const events = stamp(inits)
  const [episode] = processEpisodes(runOf(events, './ksh-lite'), events)
  if (!episode) {
    throw new Error('no episode')
  }
  return processStoryboard(episode, narration)
}

const ticksOf = (inits: readonly EventInit[]) => storyboardOf(inits).stages.map((s) => s.tick)

describe('processStoryboard', () => {
  it('draws all ten stages when the events show all of them', () => {
    expect(ticksOf(FORK_EXEC_WAIT)).toEqual([
      'fork()',
      'copy_process',
      'memory',
      'two returns',
      'execve',
      'new program',
      'echo runs',
      'zombie',
      'wait4',
      'reaped',
    ])
  })

  it('asks what fork returns in the child, and whether execve keeps the PID', () => {
    const { stages } = storyboardOf(FORK_EXEC_WAIT)
    expect(stages.find((s) => s.key === 'returns')?.predict).toMatchObject({
      answer: '0',
      options: ['0', '3', '2', '-1'],
    })
    expect(stages.find((s) => s.key === 'newprog')?.predict?.answer).toBe('Yes, still 3')
  })

  it("carries the content's simplified note onto the memory stage", () => {
    const memory = storyboardOf(FORK_EXEC_WAIT).stages.find((s) => s.key === 'memory')
    expect(memory?.simplified).toContain('each page stays shared until one side writes to it')
  })

  it('names the kernel function at work and keeps it until another takes over', () => {
    const { stages } = storyboardOf(EXEC_FAILS)
    expect(stages.find((s) => s.key === 'execfail')?.scene.now).toEqual({
      fn: 'do_execveat_common() → -ENOENT',
      file: 'fs/exec.c',
    })
    expect(stages.at(-1)?.scene.now.fn).toBe('do_exit() → exit_notify()')
  })

  it('stops at the failure when fork fails', () => {
    const { stages } = storyboardOf(FORK_FAILS)
    expect(stages.map((s) => s.tick)).toEqual(['fork()', '-1'])
    expect(stages[1]?.what).toContain('`RLIMIT_NPROC` allows')
  })

  it('shows a failed execve and a child left a zombie when nobody waits', () => {
    expect(ticksOf(EXEC_FAILS)).toEqual([
      'fork()',
      'copy_process',
      'memory',
      'two returns',
      'execve',
      'exec fails',
      'zombie',
      'still Z',
    ])
  })

  it('tells a child killed by a signal, with no Gatekeeper line, reaped by init', () => {
    const { stages } = storyboardOf(KILLED)
    const exit = stages.find((s) => s.key === 'exit')
    expect(exit?.title).toBe('Killed: a zombie')
    expect(exit?.what).toContain('`SIGKILL` killed PID 3')
    expect(exit?.gate).toBeUndefined()
    expect(stages.at(-1)?.title).toBe('Reaped by init')
  })

  it('leaves no placeholder unfilled, whatever the child did', () => {
    for (const inits of [FORK_EXEC_WAIT, EXEC_FAILS, FORK_FAILS, KILLED]) {
      const texts = storyboardOf(inits).stages.flatMap((s) => [
        s.tick,
        s.title,
        s.what,
        s.why,
        s.deeper,
        s.gate ?? '',
        s.scene.now.fn,
        ...(s.predict ? [s.predict.question, s.predict.explain, ...s.predict.options] : []),
      ])
      expect(texts.flatMap(unfilledPlaceholders)).toEqual([])
    }
  })
})

describe('episodeLabel', () => {
  it('names the child and its program, or the failed fork', () => {
    expect(episodeLabel(storyboardOf(FORK_EXEC_WAIT).episode)).toBe('PID 3 · echo')
    expect(episodeLabel(storyboardOf(FORK_FAILS).episode)).toBe('fork failed (EAGAIN)')
  })
})
