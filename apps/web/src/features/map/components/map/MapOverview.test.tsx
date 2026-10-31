import { overviewDescription } from '@features/map/utils/layout'
import { emptyProgress } from '@kernelfall/game/utils'
import { mapLayers } from '@shared/utils/map'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nodesFor, realContent } from '@/test/fixtures/map.fixture'
import { MapOverview } from './MapOverview'

describe('MapOverview', () => {
  it('is one link to the Kernel Map, named by where the player stands, before it has a size to draw at', () => {
    const layers = mapLayers(realContent(), nodesFor(emptyProgress()))
    const description = overviewDescription(layers)
    const html = renderToStaticMarkup(
      <MapOverview layers={layers} description={description} href="#/map" pulse={false} />
    )
    expect(html).toMatch(/^<a class="map-overview" href="#\/map">/)
    expect(html).toContain(`<span class="kf-visually-hidden">${description}</span>`)
  })
})
