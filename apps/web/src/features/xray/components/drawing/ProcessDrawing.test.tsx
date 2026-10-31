// @vitest-environment jsdom
import { processEpisodes, processStoryboard } from '@features/xray/utils/processes'
import { xrayContent } from '@kernelfall/levels/utils'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FORK_EXEC_WAIT, runOf, stamp } from '@/test/fixtures/trace-events.fixture'
import { ProcessDrawing } from './ProcessDrawing'

/** The zone headings' font size (Drawing.css, `.xr-zone`): the most a capital can rise above its baseline. */
const ZONE_FONT_PX = 15

const storyboard = (() => {
  const events = stamp(FORK_EXEC_WAIT)
  const [episode] = processEpisodes(runOf(events, './ksh-lite'), events)
  if (!episode) {
    throw new Error('no episode')
  }
  return processStoryboard(episode, xrayContent().narration)
})()

function drawn(step: string) {
  const stage = storyboard.stages.find((s) => s.key === step)
  if (!stage) {
    throw new Error(`no ${step} stage`)
  }
  return render(<ProcessDrawing storyboard={storyboard} scene={stage.scene} label="Fig. 2" />).container
}

describe('ProcessDrawing', () => {
  it.each(['fork', 'execve', 'exit', 'wait'])('keeps the %s crossing tag clear of the Kernel space heading', (step) => {
    const container = drawn(step)
    const tag = container.querySelector('.xr-cross rect')
    const heading = [...container.querySelectorAll('text')].find((t) => t.textContent === 'Kernel space · ring 0')
    expect(tag).not.toBeNull()
    const tagBottom = Number(tag?.getAttribute('y')) + Number(tag?.getAttribute('height'))
    expect(tagBottom).toBeLessThanOrEqual(Number(heading?.getAttribute('y')) - ZONE_FONT_PX)
  })

  it('names the parent and the child from the events', () => {
    const text = drawn('returns').textContent
    expect(text).toContain('ksh-lite · PID 2')
    expect(text).toContain('fork() → 3')
  })
})
