import { xrayContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { FORK_EXEC_WAIT, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { processEpisodes } from './process-episode.util'
import { processValues, programAfterExec, signalName, summarizeCalls } from './process-values.util'

const episode = (() => {
  const events = stamp(FORK_EXEC_WAIT)
  const [first] = processEpisodes(runOf(events, './ksh-lite'), events)
  if (!first) {
    throw new Error('no episode')
  }
  return first
})()

describe('summarizeCalls', () => {
  it('counts repeated calls in first-seen order', () => {
    expect(summarizeCalls(['write', 'getdents64', 'write'])).toBe('`write` ×2, `getdents64`')
  })
})

describe('signalName', () => {
  it('names a signal, or falls back to its number', () => {
    expect(signalName(9)).toBe('SIGKILL')
    expect(signalName(99)).toBe('signal 99')
  })
})

describe('programAfterExec', () => {
  it('is the new program after a working execve, and the parent’s otherwise', () => {
    expect(programAfterExec(episode)).toBe('echo')
    expect(programAfterExec({ ...episode, exec: { nr: 59, path: '/x', ret: -2, errno: 'ENOENT' } })).toBe('ksh-lite')
  })
})

describe('processValues', () => {
  it('fills the fragments a stage can name from what the child did', () => {
    const values = processValues(episode, xrayContent().narration.parts)
    expect(values).toMatchObject({ parent: 'ksh-lite', child: 3, program: 'echo', output: 'hi', work: '`write`' })
    expect(values.via).toContain('`clone` syscall, number 56')
    expect(values.waits).toContain('sleeps (state S)')
    expect(values.told).toBe(' The parent gets `SIGCHLD`.')
    expect(values.status).toBe('exited normally with 0 (`WIFEXITED`, `WEXITSTATUS`)')
  })
})
