// @vitest-environment jsdom

import { ACTIVE_AT, gaugeSegments, gaugeWindow, layoutMap } from '@features/map/utils/layout'
import { mapNotesOf } from '@features/map/utils/note'
import { DEFAULT_GAME_TUNING } from '@kernelfall/game/types'
import { emptyProgress, kernelMap } from '@kernelfall/game/utils'
import { mapLayers } from '@shared/utils/map'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { MapSection } from './MapSection'

const WIDTH = 774
const HEIGHT = 600

// Every stop draws one NodeMark, so its renders count the drawing's renders.
const marks = vi.hoisted(() => ({ rendered: 0 }))
vi.mock('@shared/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shared/components/ui')>()),
  NodeMark: () => {
    marks.rendered += 1
    return null
  },
}))

beforeEach(() => {
  marks.rendered = 0
  // jsdom lays nothing out: give every element the scroller's size.
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(WIDTH)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(HEIGHT)
  HTMLElement.prototype.scrollTo = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  )
  // Paint at once instead of on the next frame.
  vi.stubGlobal('requestAnimationFrame', (paint: FrameRequestCallback) => {
    paint(0)
    return 0
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function setup() {
  const content = realContent()
  const progress = emptyProgress()
  const layers = mapLayers(content, nodesFor(progress, content))
  const notes = mapNotesOf(layers, kernelMap(progress, content.game, DEFAULT_GAME_TUNING))
  const noop = () => undefined
  const view = render(
    <MapSection layers={layers} notes={notes} selectedKey={null} reducedMotion={true} onSelect={noop} onPlay={noop} />
  )
  const scroll = view.container.querySelector<HTMLDivElement>('.map-scroll')
  const bar = view.container.querySelector<HTMLSpanElement>('.map-gauge__view')
  if (!scroll || !bar) {
    throw new Error('the map section did not render its scroller and gauge')
  }
  const scene = layoutMap(layers, WIDTH)
  const scrollTo = (top: number) =>
    act(() => {
      Object.defineProperty(scroll, 'scrollTop', { value: top, configurable: true })
      fireEvent.scroll(scroll)
    })
  const svg = view.container.querySelector('svg')
  const stopEl = (key: string) => {
    const found = view.container.querySelector(`[data-stop="${key}"]`)
    if (!found) {
      throw new Error(`no stop ${key}`)
    }
    return found
  }
  const shown = () => ({
    title: view.container.querySelector('.map-note__head b')?.textContent,
    facts: view.container.querySelector('.map-note__facts')?.textContent ?? '',
    text: view.container.querySelector('.map-note__text')?.textContent,
  })
  return { view, bar, scene, layers, notes, svg, stopEl, shown, scroll, scrollTo }
}

describe('MapSection', () => {
  it('never renders the drawing again while scrolling, even across layers', () => {
    const { scene, scrollTo } = setup()
    const drawn = marks.rendered
    expect(drawn).toBe(scene.stops.length)

    for (const layer of scene.layers) {
      scrollTo(layer.top)
    }
    expect(marks.rendered).toBe(drawn)
  })

  it('moves the gauge with the scroll and marks the layer at mid-view', () => {
    const { view, bar, scene, layers, scrollTo } = setup()
    const deep = scene.layers[3]
    if (!deep) {
      throw new Error('the drawing has fewer layers than expected')
    }
    const top = deep.top - HEIGHT * ACTIVE_AT + 1
    scrollTo(top)

    const shown = gaugeWindow(top, HEIGHT, scene.layers, gaugeSegments(scene.layers))
    expect(Number(bar.style.getPropertyValue('--view-start'))).toBeCloseTo(shown.start)
    expect(Number(bar.style.getPropertyValue('--view-size'))).toBeCloseTo(shown.size)
    const current = view.container.querySelector('.map-gauge__layer[aria-current="location"]')
    const short = layers.find((layer) => layer.id === deep.id)?.short ?? deep.id
    expect(current?.getAttribute('aria-label')?.startsWith(short)).toBe(true)
  })
})

describe('MapSection: the note', () => {
  const STOP = 'act1/process-district/1.7'

  it('explains the stop under the pointer, without drawing the map again', () => {
    const { svg, stopEl, shown, notes } = setup()
    const drawn = marks.rendered
    fireEvent.mouseMove(stopEl(STOP).querySelector('desc') ?? stopEl(STOP))
    const note = notes.stops.get(STOP)
    expect(shown()).toEqual({ title: note?.title, facts: note?.facts.join(' · '), text: note?.text })
    expect(shown().title).toBe('1.7 · The Aqueducts')
    expect(marks.rendered).toBe(drawn)

    if (svg) {
      fireEvent.mouseLeave(svg)
    }
    expect(shown().title).toMatch(/^What lives here · /)
  })

  it('shows the same note for a stop on keyboard focus as on hover', () => {
    const { stopEl, shown } = setup()
    fireEvent.mouseMove(stopEl(STOP))
    const hovered = shown()
    fireEvent.mouseMove(stopEl('act1/socket-harbor/1.9'))
    fireEvent.focus(stopEl(STOP))
    expect(shown()).toEqual(hovered)
    fireEvent.blur(stopEl(STOP))
    expect(shown().title).toBe('1.9 · The Lighthouse')
  })

  it('explains the region band under the pointer, and the layer above its regions', () => {
    const { svg, scene, shown, notes } = setup()
    const userland = scene.layers.find((layer) => layer.id === 'userland')
    const district = userland?.regions.find((region) => region.key === 'act1/process-district')
    if (!svg || !userland || !district) {
      throw new Error('the drawing has no Process District')
    }
    // jsdom puts the sheet at the top of the page, so clientY is the drawing's own y.
    fireEvent.mouseMove(svg, { clientY: district.top + 4 })
    expect(shown().title).toBe(notes.regions.get(district.key)?.title)
    fireEvent.mouseMove(svg, { clientY: userland.top + 4 })
    expect(shown().title).toBe('What lives here · Userland')
  })

  it('explains a depth-gauge layer on hover and on focus, else the layer in view', () => {
    const { view, shown, layers } = setup()
    const index = layers.findIndex((layer) => layer.id === 'gate')
    const button = view.container.querySelectorAll<HTMLButtonElement>('.map-gauge__layer')[index]
    if (!button) {
      throw new Error('the gauge has no layers')
    }
    fireEvent.mouseEnter(button)
    expect(shown()).toMatchObject({ title: 'What lives here · The Syscall Gate', text: layers[index]?.note })
    fireEvent.mouseLeave(button)
    expect(shown().title).not.toBe('What lives here · The Syscall Gate')
    fireEvent.focus(button)
    expect(shown().title).toBe('What lives here · The Syscall Gate')
  })

  it('sits under the drawing, outside the scroller, so it never covers a stop', () => {
    const { view, scroll } = setup()
    const note = view.container.querySelector('.map-note')
    expect(note).not.toBeNull()
    expect(scroll.contains(note)).toBe(false)
    expect(note?.previousElementSibling).toBe(scroll)
  })
})
