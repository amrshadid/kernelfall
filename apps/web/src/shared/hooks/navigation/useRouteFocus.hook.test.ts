// @vitest-environment jsdom
import type { Route } from '@shared/types/definitions/route'
import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRouteFocus } from './useRouteFocus.hook'

function heading(): HTMLElement {
  const h1 = document.body.appendChild(document.createElement('h1'))
  h1.tabIndex = -1
  return h1
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  document.body.replaceChildren()
})

describe('useRouteFocus', () => {
  it("focuses the new screen's heading once its lazy chunk renders it", () => {
    renderHook(() => useRouteFocus({ name: 'map' }, true))
    const h1 = heading()
    vi.advanceTimersToNextFrame()
    expect(document.activeElement).toBe(h1)
  })

  it('leaves focus alone when only a Codex card opens over the level', () => {
    const h1 = heading()
    const { rerender } = renderHook(({ route }) => useRouteFocus(route, true), {
      initialProps: { route: { name: 'play', levelId: 'a' } as Route },
    })
    expect(document.activeElement).toBe(h1)
    const button = document.body.appendChild(document.createElement('button'))
    button.focus()
    rerender({ route: { name: 'play', levelId: 'a', card: 'fork' } })
    expect(document.activeElement).toBe(button)
  })
})
