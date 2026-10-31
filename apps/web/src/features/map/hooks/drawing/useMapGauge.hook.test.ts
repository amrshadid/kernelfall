// @vitest-environment jsdom

import { HERE_AT, KEEP_IN_VIEW_TOP } from '@features/map/utils/layout'
import { emptyProgress } from '@kernelfall/game/utils'
import { mapLayers } from '@shared/utils/map'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { useMapGauge } from './useMapGauge.hook'

const WIDTH = 774
const HEIGHT = 600

function scrollBox(): HTMLDivElement {
  const element = document.createElement('div')
  Object.defineProperty(element, 'clientWidth', { value: WIDTH })
  Object.defineProperty(element, 'clientHeight', { value: HEIGHT })
  Object.defineProperty(element, 'scrollTop', { value: 0, writable: true })
  element.scrollTo = vi.fn() as typeof element.scrollTo
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

function setup() {
  const layers = mapLayers(realContent(), nodesFor(emptyProgress()))
  const element = scrollBox()
  const hook = renderHook(() => useMapGauge(layers, true))
  act(() => hook.result.current.scrollerRef(element))
  return { hook, element, layers }
}

describe('useMapGauge', () => {
  it('lays the drawing out at the scroller width and scrolls to "You are here" once', () => {
    const { hook, element } = setup()
    const scene = hook.result.current.scene
    expect(scene?.width).toBe(WIDTH)
    const hereY = scene?.here?.y ?? 0
    expect(element.scrollTo).toHaveBeenCalledWith({
      top: Math.max(0, Math.round(hereY - HEIGHT * HERE_AT)),
      behavior: 'instant',
    })
    expect(hook.result.current.gaugeLayers).toHaveLength(scene?.layers.length ?? -1)
  })

  it('jumps to a layer top and keeps a focused stop in view', () => {
    const { hook, element } = setup()
    const scene = hook.result.current.scene
    const deep = scene?.layers[3]
    vi.mocked(element.scrollTo).mockClear()

    act(() => hook.result.current.jumpTo(deep?.id ?? 'deep'))
    expect(element.scrollTo).toHaveBeenCalledWith({ top: Math.round(deep?.top ?? 0), behavior: 'instant' })

    vi.mocked(element.scrollTo).mockClear()
    const visible = scene?.stops.find((stop) => stop.y > KEEP_IN_VIEW_TOP && stop.y < HEIGHT / 2)
    if (visible) {
      act(() => hook.result.current.keepInView(visible))
      expect(element.scrollTo).not.toHaveBeenCalled()
    }
    const far = scene?.stops[scene.stops.length - 1]
    if (far) {
      act(() => hook.result.current.keepInView(far))
      expect(element.scrollTo).toHaveBeenCalledTimes(1)
    }
  })
})
