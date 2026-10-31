import type { MapScene, OverviewWindow } from '@features/map/types'
import type { MapLayer } from '@shared/types'
import { OVERVIEW_HERE_AT } from './map-layout.constants'

/** Centred on "you" (the sheet's top when nowhere) and kept inside the drawing; `view` in px. */
export function overviewWindow(scene: MapScene, view: number): OverviewWindow {
  if (view >= scene.height) {
    return { top: 0, height: scene.height, fadeTop: false, fadeBottom: false }
  }
  const wanted = scene.here ? scene.here.y - view * OVERVIEW_HERE_AT : 0
  const top = Math.round(Math.min(Math.max(0, wanted), scene.height - view))
  return { top, height: view, fadeTop: top > 0, fadeBottom: top + view < scene.height }
}

/** "You are at P.2 First Words, in the Surface layer; next: P.3 Speak to the Shell." */
export function overviewDescription(layers: readonly MapLayer[]): string {
  const stops = layers.flatMap((layer) =>
    layer.regions.flatMap((region) => region.nodes.map((node) => ({ node, layer })))
  )
  const at = stops.findIndex((stop) => stop.node.here)
  const here = stops[at]
  if (!here) {
    return 'Every level built so far is rebuilt. Open the Kernel Map to replay one.'
  }
  const where = here.layer.id === 'gate' ? 'at the Syscall Gate' : `in the ${here.layer.short} layer`
  const next = stops.slice(at + 1).find((stop) => !stop.node.side)?.node
  return [
    `You are at ${here.node.number} ${here.node.title}, ${where}`,
    next ? `; next: ${next.number} ${next.title}.` : '.',
    ' Open the Kernel Map.',
  ].join('')
}
