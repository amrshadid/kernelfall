import { useMapGauge } from '@features/map/hooks/drawing'
import { useMapNote } from '@features/map/hooks/note'
import type { MapNotes } from '@features/map/types'
import type { MapLayer } from '@shared/types'
import { DepthGauge } from './DepthGauge'
import './MapSection.css'
import { MapDrawing } from './MapDrawing'

export interface MapSectionProps {
  layers: readonly MapLayer[]
  /** What each stop, region and layer is, for the note under the drawing. */
  notes: MapNotes
  selectedKey: string | null
  reducedMotion: boolean
  onSelect: (key: string) => void
  onPlay: (key: string) => void
}

export function MapSection({ layers, notes, selectedKey, reducedMotion, onSelect, onPlay }: MapSectionProps) {
  const gauge = useMapGauge(layers, reducedMotion)
  const { scene } = gauge
  const { note, point, focus } = useMapNote(notes, gauge.active)

  return (
    <div className="map-section">
      {scene ? (
        <DepthGauge
          layers={gauge.gaugeLayers}
          current={gauge.active}
          viewRef={gauge.viewBar}
          here={gauge.here}
          onJump={gauge.jumpTo}
          onFindHere={gauge.findHere}
          onHover={(id) => point(id ? { kind: 'layer', id } : null)}
          onFocusLayer={(id) => focus(id ? { kind: 'layer', id } : null)}
        />
      ) : (
        <div className="map-gauge" />
      )}
      {/* Second child in both branches above, so the scroller is never remounted. */}
      <div className="map-scroll" ref={gauge.scrollerRef}>
        {scene && (
          <MapDrawing
            variant="map"
            scene={scene}
            selectedKey={selectedKey}
            pulse={!reducedMotion}
            onSelect={onSelect}
            onPlay={onPlay}
            onFocusStop={gauge.keepInView}
            onPoint={point}
            onFocusNote={focus}
          />
        )}
      </div>
      {/* Under the drawing, never over it: the note can't cover the road, a stop or a label. */}
      <div className="map-note">
        {note && (
          <>
            <p className="map-note__head">
              <b>{note.title}</b>
              {note.facts.length > 0 && <span className="map-note__facts">{note.facts.join(' · ')}</span>}
            </p>
            <p className="map-note__text">{note.text}</p>
          </>
        )}
      </div>
    </div>
  )
}
