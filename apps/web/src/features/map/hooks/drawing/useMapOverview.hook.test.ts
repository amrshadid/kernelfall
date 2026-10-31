// @vitest-environment jsdom

import { layoutMap, overviewWindow } from '@features/map/utils/layout'
import { emptyProgress } from '@kernelfall/game/utils'
import { mapLayers } from '@shared/utils/map'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { doneWithHelp, nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { useMapOverview } from './useMapOverview.hook'

const WIDTH = 460
const HEIGHT = 420

function frame(): HTMLDivElement {
  const element = document.createElement('div')
  Object.defineProperty(element, 'clientWidth', { value: WIDTH })
  Object.defineProperty(element, 'clientHeight', { value: HEIGHT })
  return element
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMapOverview', () => {
  it('waits for a size, then lays out with the Kernel Map own layout at the frame width', () => {
    const loaded = realContent()
    const layers = mapLayers(loaded, nodesFor(doneWithHelp(loaded.game.levels[0]?.id ?? ''), loaded))
    const hook = renderHook(() => useMapOverview(layers))
    expect(hook.result.current.scene).toBeNull()

    act(() => hook.result.current.frameRef(frame()))
    const { scene, shown } = hook.result.current
    expect(scene).toEqual(layoutMap(layers, WIDTH, 'overview'))
    expect(shown).toEqual(scene && overviewWindow(scene, HEIGHT))
    // Same stops and the same "you" as the Kernel Map at this width.
    const map = layoutMap(layers, WIDTH)
    expect(scene?.stops.map((stop) => [stop.key, stop.x])).toEqual(map.stops.map((stop) => [stop.key, stop.x]))
    expect(scene?.here?.key).toBe(map.here?.key)
  })

  it('lays out again only when the layers change', () => {
    const layers = mapLayers(realContent(), nodesFor(emptyProgress()))
    const hook = renderHook(({ input }) => useMapOverview(input), { initialProps: { input: layers } })
    act(() => hook.result.current.frameRef(frame()))
    const first = hook.result.current.scene
    hook.rerender({ input: layers })
    expect(hook.result.current.scene).toBe(first)
  })
})
