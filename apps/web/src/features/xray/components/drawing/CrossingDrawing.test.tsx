// @vitest-environment jsdom
import { toXrayCalls } from '@features/xray/utils/calls'
import { crossingStoryboard, NO_BREAK } from '@features/xray/utils/crossing'
import { CARD_CHARS } from '@features/xray/utils/drawing'
import { xrayContent } from '@kernelfall/levels/utils'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ECHO, runOf } from '@/test/fixtures/trace-events.fixture'
import { CrossingDrawing } from './CrossingDrawing'

// jsdom can't read the recorded runs from disk, so this is P.2's write(1, "hello\n", 6) built by hand.
function echoWrite() {
  const content = xrayContent()
  const [call] = toXrayCalls(runOf(ECHO, 'echo hello'), ECHO, content)
  if (!call) {
    throw new Error('no write')
  }
  return crossingStoryboard(call, content.narration)
}

describe('CrossingDrawing', () => {
  it('marks exactly one thing in red at every beat', () => {
    const board = echoWrite()
    for (const stage of board.stages) {
      const { container, unmount } = render(<CrossingDrawing storyboard={board} scene={stage.scene} label="Fig. 1" />)
      expect(container.querySelectorAll('.xr-box--on'), stage.key).toHaveLength(1)
      unmount()
    }
  })

  it('carries the request down and brings the answer back up', () => {
    const board = echoWrite()
    const cardY = (key: string) => {
      const scene = board.stages.find((s) => s.key === key)?.scene
      if (!scene) {
        throw new Error(key)
      }
      const { container, unmount } = render(<CrossingDrawing storyboard={board} scene={scene} label="Fig. 1" />)
      const card = container.querySelector<SVGGElement>('.xr-move')
      const y = Number(card?.style.transform.match(/, (\d+)px/)?.[1])
      const text = card?.textContent ?? ''
      unmount()
      return { y, text }
    }
    const ask = cardY('ask')
    const kernel = cardY('kernel')
    const answer = cardY('answer')
    expect(kernel.y).toBeGreaterThan(ask.y)
    expect(answer.y).toBe(ask.y)
    expect(ask.text.replaceAll(NO_BREAK, ' ')).toContain('write 6 bytes to fd 1')
    expect(answer.text).toContain('all 6 bytes taken')
  })

  it("keeps the card's plain words inside it", () => {
    const board = echoWrite()
    const scene = board.stages[0]?.scene
    if (!scene) {
      throw new Error('no stage')
    }
    const { container } = render(<CrossingDrawing storyboard={board} scene={scene} label="Fig. 1" />)
    const lines = [...container.querySelectorAll('.xr-card-say')].map((t) => t.textContent ?? '')
    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      expect(line.length, line).toBeLessThanOrEqual(CARD_CHARS)
    }
  })
})
