import type { ProcessStoryboard } from '@features/xray/types'
import { processEpisodes, processStoryboard } from '@features/xray/utils/processes'
import { xrayContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { FORK_EXEC_WAIT, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { CHILD_X, POINTER_X, STATE_TEXT } from './process-drawing.constants'
import { exitText, processDrawingLayout, processDrawingText } from './process-drawing.util'

const storyboard: ProcessStoryboard = (() => {
  const events = stamp(FORK_EXEC_WAIT)
  const [episode] = processEpisodes(runOf(events, './ksh-lite'), events)
  if (!episode) {
    throw new Error('no episode')
  }
  return processStoryboard(episode, xrayContent().narration)
})()

function sceneOf(step: string) {
  const scene = storyboard.stages.find((s) => s.key === step)?.scene
  if (!scene) {
    throw new Error(`no ${step} stage`)
  }
  return scene
}

describe('processDrawingText', () => {
  it('shows fork returning twice: the child PID in the parent, 0 in the child', () => {
    const text = processDrawingText(storyboard, sceneOf('returns'))
    expect(text.parentTitle).toBe('ksh-lite · PID 2')
    expect(text.parentLine1).toBe('fork() → 3')
    expect(text.childLine1).toBe('fork() → 0')
  })

  it('reports what wait4 collected', () => {
    expect(processDrawingText(storyboard, sceneOf('wait')).parentLine2).toBe('wait4 → 3, status 0')
  })

  it('prints the first line the child wrote', () => {
    expect(processDrawingText(storyboard, sceneOf('runs')).printed).toBe('hi')
  })
})

describe('exitText', () => {
  it('stays blank until the child has ended', () => {
    expect(exitText(storyboard, sceneOf('returns'))).toBe('—')
    expect(exitText(storyboard, sceneOf('wait'))).toBe('0')
  })
})

describe('processDrawingLayout', () => {
  it('hatches the shared pages while copy-on-write is on show', () => {
    const layout = processDrawingLayout(storyboard, sceneOf('memory'))
    expect(layout.parentPages.kind).toBe('shared')
    expect(layout.childPages.kind).toBe('shared')
  })

  it('gives the child new code and data after execve', () => {
    const layout = processDrawingLayout(storyboard, sceneOf('newprog'))
    expect(layout.childPages.kind).toBe('new')
    expect(layout.childPages.labels).toEqual(['new', 'new', 'heap', 'stack'])
  })

  it('points at the child when the story follows it', () => {
    expect(processDrawingLayout(storyboard, sceneOf('newprog')).pointerX).toBe(CHILD_X - POINTER_X.childGap)
  })

  it('shows the zombie in task_struct', () => {
    const rows = processDrawingLayout(storyboard, sceneOf('exit')).childRows
    expect(rows.find((r) => r.label === 'state')?.value).toBe(STATE_TEXT.Z)
  })
})
