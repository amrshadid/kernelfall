import { EDGE, layoutMap, NODE_SIZE, overviewDescription, overviewWindow } from '@features/map/utils/layout'
import { emptyProgress } from '@kernelfall/game/utils'
import { hereFlag, mapLayers } from '@shared/utils/map'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { doneWithHelp, nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { MapDrawing } from './MapDrawing'

function render(progress = emptyProgress(), selectedKey: string | null = null) {
  const loaded = realContent()
  const scene = layoutMap(mapLayers(loaded, nodesFor(progress, loaded)), 774)
  const noop = () => undefined
  const html = renderToStaticMarkup(
    <MapDrawing
      variant="map"
      scene={scene}
      selectedKey={selectedKey}
      pulse={false}
      onSelect={noop}
      onPlay={noop}
      onFocusStop={noop}
      onPoint={noop}
      onFocusNote={noop}
    />
  )
  return { scene, html }
}

const buttons = (html: string) => [...html.matchAll(/<g role="button" tabindex="(-?\d)" aria-label="([^"]+)"/g)]

describe('MapDrawing', () => {
  it('makes every stop a button with an accessible name, in play order', () => {
    const { scene, html } = render()
    const found = buttons(html)
    expect(found).toHaveLength(scene.stops.length)
    expect(found[0]?.[2]).toBe('P.1 Power On, available, you are here')
    expect(found[1]?.[2]).toBe('P.2 First Words, locked')
    expect(found.find((match) => match[2]?.startsWith('3.10'))?.[2]).toBe(
      '3.10 Where the Time Goes, side level, not built yet'
    )
    expect(found.find((match) => match[2]?.startsWith('1.B'))?.[2]).toContain(', boss, ')
  })

  it('describes every stop to screen readers by its summary', () => {
    const { scene, html } = render()
    const described = [
      ...html.matchAll(/<g role="button"[^>]*aria-describedby="([^"]+)"[^>]*><desc id="([^"]+)">([^<]*)<\/desc>/g),
    ]
    expect(described).toHaveLength(scene.stops.length)
    expect(described.every(([, ref, id]) => ref === id)).toBe(true)
    const text = (escaped: string | undefined) =>
      (escaped ?? '')
        .replaceAll('&#x27;', "'")
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&amp;', '&')
    expect(described.map((match) => text(match[3]))).toEqual(scene.stops.map((stop) => stop.node.summary))
  })

  it('has one tab stop: "you are here" until something is selected', () => {
    const fresh = buttons(render().html).filter((match) => match[1] === '0')
    expect(fresh).toHaveLength(1)
    expect(fresh[0]?.[2]).toMatch(/^P\.1 .*you are here$/)

    const selected = buttons(render(emptyProgress(), 'act1/socket-harbor/1.9').html).filter((m) => m[1] === '0')
    expect(selected.map((match) => match[2])).toEqual(['1.9 The Lighthouse, not built yet'])
  })

  it('groups the stops by layer, each named', () => {
    const { html } = render()
    const groups = [...html.matchAll(/<g role="group" aria-label="([^"]+)"/g)].map((match) => match[1])
    expect(groups).toEqual(['The Surface', 'Userland', 'The Syscall Gate', 'The Deep', 'The Core', 'Bedrock: Hardware'])
  })

  it('flags "You are here" once and moves it with progress', () => {
    expect(render().html.match(/You are here/g)).toHaveLength(1)
    const later = render(doneWithHelp(realContent().game.levels[0]?.id ?? ''))
    expect(later.scene.here?.key).toBe('prologue/boot-path/P.2')
  })

  it('draws the flag from the shared flag model', () => {
    const { scene, html } = render()
    if (!scene.here) {
      throw new Error('a fresh save has somewhere to stand')
    }
    const flag = hereFlag(scene.here, NODE_SIZE, { left: EDGE, right: scene.width - EDGE, top: 0 })
    expect(html).toContain(`<path d="${flag.pin}" class="kf-flag__red"`)
    expect(html).toContain(`<rect x="${flag.box.x}" y="${flag.box.y}" width="96" height="22" class="kf-flag__red"`)
  })

  it('draws the A–A section line and a shut Gate', () => {
    const { html } = render()
    expect(html.match(/class="map-fig__section"/g)).toHaveLength(2)
    expect(html).toContain('class="map-fig__pier"')
  })
})

describe('MapDrawing overview', () => {
  function overview(progress = emptyProgress()) {
    const loaded = realContent()
    const layers = mapLayers(loaded, nodesFor(progress, loaded))
    const scene = layoutMap(layers, 460, 'overview')
    const shown = overviewWindow(scene, 400)
    const description = overviewDescription(layers)
    const html = renderToStaticMarkup(
      <MapDrawing variant="overview" scene={scene} shown={shown} description={description} pulse={false} />
    )
    return { scene, shown, description, html, map: render(progress).html }
  }

  const marks = (html: string) => html.match(/<g transform="translate\(/g)?.length

  it('is one read-only image, described in words and cropped to the window around "you"', () => {
    const { scene, shown, description, html } = overview()
    expect(html).toMatch(
      new RegExp(
        `^<svg class="map-fig map-fig--overview" width="460" height="${shown.height}" viewBox="0 ${shown.top} 460 ${shown.height}" role="img"`
      )
    )
    expect(html).toContain(`>${description}</title>`)
    expect(html).not.toContain('role="button"')
    expect(html).not.toContain('tabindex')
    expect(html.match(/You are here/g)).toHaveLength(1)
    expect(scene.here?.key).toBe('prologue/boot-path/P.1')
  })

  it('draws every stop, the road, the Gate and the flag with the Kernel Map own marks', () => {
    const { html, map } = overview(doneWithHelp(realContent().game.levels[0]?.id ?? ''))
    expect(marks(html)).toBe(marks(map))
    for (const mark of ['class="kf-road"', 'class="kf-road kf-road--ahead"', 'class="map-fig__pier"', 'kf-flag__red']) {
      expect(html).toContain(mark)
    }
    expect(html.match(/class="map-fig__section"/g)).toHaveLength(2)
  })
})
