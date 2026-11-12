import { useMapOverview } from '@features/map/hooks/drawing'
import type { MapLayer } from '@shared/types'
import { MapDrawing } from './MapDrawing'
import './MapOverview.css'

export interface MapOverviewProps {
  layers: readonly MapLayer[]
  /** Where the player stands and what's next; the link's accessible name. */
  description: string
  /** The Kernel Map, which opens scrolled to "you"; null where the drawing is only a figure. */
  href: string | null
  pulse: boolean
}

/** The Kernel Map's own drawing, windowed around "you": one link to the full map, or a plain figure. */
export function MapOverview({ layers, description, href, pulse }: MapOverviewProps) {
  const { frameRef, scene, shown } = useMapOverview(layers)
  const fades = `${shown?.fadeTop ? ' map-overview__frame--fade-top' : ''}${shown?.fadeBottom ? ' map-overview__frame--fade-bottom' : ''}`
  const frame = (
    // A figure has no window to fit: it takes the drawing's own height and shows all of it.
    <div
      ref={frameRef}
      className={`map-overview__frame${fades}`}
      style={href === null && scene ? { height: scene.height } : undefined}
    >
      {scene && shown ? (
        <MapDrawing variant="overview" scene={scene} shown={shown} description={description} pulse={pulse} />
      ) : (
        <span className="kf-visually-hidden">{description}</span>
      )}
    </div>
  )
  return href === null ? (
    <div className="map-overview">{frame}</div>
  ) : (
    <a className="map-overview" href={href}>
      {frame}
    </a>
  )
}
