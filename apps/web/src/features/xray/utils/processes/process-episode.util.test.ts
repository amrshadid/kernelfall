import { describe, expect, it } from 'vitest'
import { type EventInit, FORK_EXEC_WAIT, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { isEpisodeOver, processEpisodes } from './process-episode.util'

const episodesOf = (inits: readonly EventInit[], commandLine = './ksh-lite') => {
  const events = stamp(inits)
  return processEpisodes(runOf(events, commandLine), events)
}

describe('processEpisodes', () => {
  it("tells one child's life from the events: fork, exec, output, exit, SIGCHLD, wait4, reaped", () => {
    const [episode, ...rest] = episodesOf(FORK_EXEC_WAIT)
    expect(rest).toEqual([])
    expect(episode).toMatchObject({
      parent: { pid: 2, program: 'ksh-lite' },
      fork: { name: 'clone', nr: 56, ret: 3, errno: null },
      child: 3,
      childReturned: true,
      exec: { nr: 59, path: '/bin/echo', ret: 0, errno: null },
      childProgram: 'echo',
      work: ['write'],
      printed: 'hi\n',
      exit: { nr: 231, code: 0, signal: null },
      sigchld: true,
      wait: { nr: 61, ret: 3 },
      reaped: { byParent: true },
    })
  })

  it('records a failed fork with its errno and no child', () => {
    const [episode] = episodesOf([
      { type: 'sys_enter', pid: 2, nr: 56, name: 'clone', args: [17, 0, 0, 0, 0] },
      { type: 'sys_exit', pid: 2, nr: 56, name: 'clone', ret: -11 },
    ])
    expect(episode).toMatchObject({ child: null, fork: { ret: -11, errno: 'EAGAIN' } })
  })

  it('leaves out processes the command did not start', () => {
    expect(episodesOf([{ type: 'sched_process_fork', parentPid: 1, childPid: 9 }])).toEqual([])
  })

  it("calls a child's story over only once it is reaped, so a running shell shows finished children", () => {
    const reaped = FORK_EXEC_WAIT.findIndex((init) => init.type === 'sched_process_free')
    const [running] = episodesOf(FORK_EXEC_WAIT.slice(0, reaped))
    const [done] = episodesOf(FORK_EXEC_WAIT)
    expect(running && isEpisodeOver(running)).toBe(false)
    expect(done && isEpisodeOver(done)).toBe(true)
  })

  // `find /` is one child making ~47k calls: copying its list per call took seconds.
  it("counts a busy child's calls in linear time", () => {
    const exec = FORK_EXEC_WAIT.findIndex((init) => init.type === 'sched_process_exec')
    const busy: EventInit[] = Array.from({ length: 100_000 }, (_, i) =>
      i % 2 === 0
        ? { type: 'sys_enter', pid: 3, nr: 383, name: 'statx', args: [0, 0, 0, 0, 0] }
        : { type: 'sys_exit', pid: 3, nr: 383, name: 'statx', ret: 0 }
    )
    const started = performance.now()
    const [episode] = episodesOf([...FORK_EXEC_WAIT.slice(0, exec + 2), ...busy])
    expect(episode?.work).toHaveLength(50_000)
    expect(performance.now() - started).toBeLessThan(500)
  })
})
