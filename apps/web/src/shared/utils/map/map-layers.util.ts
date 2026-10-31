import type { LoadedContent } from '@kernelfall/levels/types'
import type { LayerId, LayerInfo, MapLayer, MapNode, MapRegion, Tone } from '@shared/types'
import { LAYER_IDS } from './map-layers.constants'
import { isDone, regionKeyOf } from './map-nodes.util'

/** The map draws each layer in its own style, so it only knows the layers it can draw. */
const isLayerId = (key: string): key is LayerId => (LAYER_IDS as readonly string[]).includes(key)

/** Every slot done: rebuilt; any done or open: in progress; else dark. */
export function toneOf(nodes: readonly Pick<MapNode, 'state'>[]): Tone {
  const done = nodes.filter(isDone).length
  if (nodes.length > 0 && done === nodes.length) {
    return 'rebuilt'
  }
  const open = nodes.some((node) => node.state === 'progress' || node.state === 'available')
  return done > 0 || open ? 'progress' : 'dark'
}

const TONE_WORDS: Readonly<Record<Tone, string>> = { rebuilt: 'rebuilt', progress: 'in progress', dark: 'dark' }

export function layersOf(content: LoadedContent): readonly LayerInfo[] {
  return content.layers.flatMap(({ key, ...text }) => (isLayerId(key) ? [{ id: key, ...text }] : []))
}

/** Bedrock has no levels, but it is always drawn. */
export function mapLayers(content: LoadedContent, nodes: readonly MapNode[]): readonly MapLayer[] {
  const regions = new Map<string, MapRegion[]>()
  for (const act of content.acts) {
    for (const region of act.regions) {
      const key = regionKeyOf(act.act, region.id)
      const inRegion = nodes.filter((node) => node.regionKey === key)
      const tone = toneOf(inRegion)
      const list = regions.get(region.layer) ?? []
      list.push({
        key,
        name: region.name,
        boss: region.boss,
        info: { caption: region.caption, source: region.source, guide: region.guide },
        nodes: inRegion,
        tone,
        progress: `${TONE_WORDS[tone]} · ${inRegion.filter(isDone).length} of ${inRegion.length}`,
      })
      regions.set(region.layer, list)
    }
  }
  return layersOf(content).map((info) => {
    const own = regions.get(info.id) ?? []
    const stops = own.flatMap((region) => region.nodes)
    const done = stops.filter(isDone).length
    const progress = stops.length === 0 ? '' : `${done} of ${stops.length} rebuilt`
    return {
      ...info,
      regions: own,
      done,
      total: stops.length,
      tone: toneOf(stops),
      progress,
      summary: [
        `${info.name}. ${info.caption}`,
        progress === '' ? null : `${progress}.`,
        `Kernel source: ${info.source}.`,
      ]
        .filter((part) => part !== null)
        .join(' '),
      hasHere: stops.some((node) => node.here),
    }
  })
}
