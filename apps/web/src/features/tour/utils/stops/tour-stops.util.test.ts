import type { TourStop } from '@features/tour/types'
import { describe, expect, it } from 'vitest'
import { MAX_STOP_TEXT_LENGTH, TOUR_STOPS } from './tour-stops.constants'
import { stopsToShow } from './tour-stops.util'

const stop = (id: string, selector: string): TourStop => ({ id, selector, title: id, text: id })

const STOPS = [
  stop('level:guide', '#level-guide'),
  stop('level:editor', '#level-editor'),
  stop('level:terminal', '#level-terminal'),
  stop('level:xray', '#level-xray'),
]

const onScreen =
  (...selectors: string[]) =>
  (selector: string) =>
    selectors.includes(selector)

describe('stopsToShow', () => {
  it("never shows a panel the story hasn't opened yet", () => {
    const shown = stopsToShow(STOPS, {
      mode: 'auto',
      seen: [],
      isPresent: onScreen('#level-guide', '#level-terminal'),
    })
    expect(shown.map((s) => s.id)).toEqual(['level:guide', 'level:terminal'])
  })

  it('starts on its own only for stops not seen yet, such as a panel that just appeared', () => {
    const shown = stopsToShow(STOPS, {
      mode: 'auto',
      seen: ['level:guide', 'level:terminal'],
      isPresent: onScreen('#level-guide', '#level-terminal', '#level-xray'),
    })
    expect(shown.map((s) => s.id)).toEqual(['level:xray'])
  })

  it('has nothing to start once every stop on screen was seen', () => {
    const shown = stopsToShow(STOPS, {
      mode: 'auto',
      seen: ['level:guide'],
      isPresent: onScreen('#level-guide'),
    })
    expect(shown).toEqual([])
  })

  it('replays every stop on screen, seen or not', () => {
    const shown = stopsToShow(STOPS, {
      mode: 'replay',
      seen: STOPS.map((s) => s.id),
      isPresent: onScreen('#level-guide', '#level-editor'),
    })
    expect(shown.map((s) => s.id)).toEqual(['level:guide', 'level:editor'])
  })
})

describe('TOUR_STOPS', () => {
  it('uses unique ids prefixed with their screen', () => {
    for (const [screen, stops] of Object.entries(TOUR_STOPS)) {
      const ids = stops.map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(ids.every((id) => id.startsWith(`${screen}:`))).toBe(true)
    }
  })

  it('keeps each stop to one short sentence or two', () => {
    for (const stops of Object.values(TOUR_STOPS)) {
      for (const s of stops) {
        expect(s.text.length).toBeLessThanOrEqual(MAX_STOP_TEXT_LENGTH)
      }
    }
  })

  it('tours the vertical map: the road, its layers and the depth gauge', () => {
    const map = TOUR_STOPS.map
    expect(map.map((s) => s.selector)).toContain('nav.map-gauge')
    expect(map.find((s) => s.id === 'map:drawing')?.text).toMatch(/Page Up and Page Down change layer/)
  })
})
