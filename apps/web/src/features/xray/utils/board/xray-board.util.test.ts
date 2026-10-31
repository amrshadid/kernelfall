import { toXrayCalls } from '@features/xray/utils/calls'
import { processEpisodes, processStoryboard } from '@features/xray/utils/processes'
import { syscallStoryboard } from '@features/xray/utils/syscalls'
import { xrayContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { ECHO, FORK_EXEC_WAIT, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { NO_RUN } from './xray-board.constants'
import {
  memoryKeysOf,
  nextCallPick,
  pickCall,
  pickEpisode,
  picksOf,
  runChoices,
  xrayCaption,
  xrayEmptyText,
} from './xray-board.util'

const content = xrayContent()
const echoRun = runOf(ECHO, 'echo hello')
const calls = toXrayCalls(echoRun, ECHO, content)
const forkEvents = stamp(FORK_EXEC_WAIT)
const forkRun = runOf(forkEvents, './ksh-lite')
const episodes = processEpisodes(forkRun, forkEvents)

describe('pickCall', () => {
  it('takes the picked call, or the default one', () => {
    const [first, second] = calls
    expect(pickCall(calls, String(second?.id))).toBe(second)
    expect(pickCall(calls, null)?.name).toBe(first?.name)
    expect(pickCall(calls, null, second?.id ?? null)).toBe(second)
  })
})

describe('nextCallPick', () => {
  it('runs on through the lesson when there is one, else through every call', () => {
    const [write, exit] = calls
    expect(nextCallPick(calls, [], write?.id ?? null)?.label).toBe('exit_group')
    expect(nextCallPick(calls, [write as (typeof calls)[number]], write?.id ?? null)).toBeUndefined()
    expect(nextCallPick(calls, [], exit?.id ?? null)).toBeUndefined()
  })
})

describe('pickEpisode', () => {
  it("leads with a running shell's newest child, and the first one after", () => {
    const twice = [...episodes, { ...episodes[0], key: 'later' } as (typeof episodes)[number]]
    expect(pickEpisode(twice, null, true)?.key).toBe('later')
    expect(pickEpisode(twice, null, false)).toBe(episodes[0])
    expect(pickEpisode(twice, 'later', false)?.key).toBe('later')
  })
})

describe('picksOf', () => {
  it('lists calls by name in Syscalls, children in Processes', () => {
    expect(picksOf('syscalls', calls, episodes).map((p) => p.label)).toEqual(calls.map((c) => c.name))
    expect(picksOf('processes', calls, episodes)).toHaveLength(episodes.length)
  })

  it('has nothing to pick in Section: it draws the whole run', () => {
    expect(picksOf('section', calls, episodes)).toEqual([])
  })
})

describe('xrayCaption for Section', () => {
  it('names the command in Fig. 3', () => {
    expect(xrayCaption({ kind: 'section', view: { floors: [], total: 0 }, commandLine: 'cat /etc/motd ' })).toBe(
      'Fig. 3. Section of the Machine: the parts `cat /etc/motd` passed through.'
    )
  })
})

describe('runChoices', () => {
  it('marks a command still running', () => {
    expect(runChoices([{ ...echoRun, running: true }])[0]?.label).toBe('echo hello (running)')
  })
})

describe('xrayEmptyText', () => {
  const base = { run: echoRun, lens: 'syscalls', live: false, count: 0, logNote: null } as const

  it('asks for a command before anything has run', () => {
    expect(xrayEmptyText({ ...base, run: undefined })).toBe(NO_RUN)
  })

  it('is null when there is something to draw', () => {
    expect(xrayEmptyText({ ...base, count: 1 })).toBeNull()
  })

  it('says why a finished command shows nothing', () => {
    expect(xrayEmptyText(base)).toBe('This command made no syscalls.')
    expect(xrayEmptyText({ ...base, lens: 'processes' })).toContain('never called `fork()`')
  })

  it('waits for a running command', () => {
    expect(xrayEmptyText({ ...base, live: true })).toContain('is still running')
  })
})

describe('xrayCaption', () => {
  it('names the call in Fig. 1 and the fork in Fig. 2', () => {
    const call = calls[0]
    const episode = episodes[0]
    if (!call || !episode) {
      throw new Error('no figure')
    }
    expect(xrayCaption({ kind: 'syscalls', storyboard: syscallStoryboard(call, content.narration) })).toMatch(
      /^Fig\. 1\. .*, end to end\.$/
    )
    expect(xrayCaption({ kind: 'processes', storyboard: processStoryboard(episode, content.narration) })).toBe(
      'Fig. 2. ksh-lite forks PID 3, which runs /bin/echo.'
    )
    expect(xrayCaption(null)).toBe('')
  })
})

describe('memoryKeysOf', () => {
  it('keeps memory per level, view and kind of call, and autoplay per level step', () => {
    expect(memoryKeysOf(null, null, 'processes', null)).toEqual({
      memoryKey: 'free:processes:fork',
      autoplayKey: 'free:any',
    })
    expect(memoryKeysOf('1.4', 'build', 'processes', null).autoplayKey).toBe('1.4:build')
  })
})
