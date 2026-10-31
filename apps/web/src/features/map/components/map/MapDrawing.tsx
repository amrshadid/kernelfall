import type { MapNoteTarget, MapScene, OverviewWindow, SceneStop } from '@features/map/types'
import { EDGE, NODE_SIZE } from '@features/map/utils/layout'
import { targetAt } from '@features/map/utils/note'
import { HereFlag, RoadPath } from '@shared/components/marks'
import { NodeMark } from '@shared/components/ui'
import { type KeyboardEvent, type MouseEvent, memo, useId, useRef } from 'react'
import './MapDrawing.css'
import { MapGate } from './MapGate'
import { MapTexts } from './MapTexts'

interface DrawingBase {
  scene: MapScene
  /** Plays one gentle pulse on the "you are here" ring; off under reduced motion. */
  pulse: boolean
}

/** The Kernel Map: every stop a button. */
interface MapDrawingInteractive extends DrawingBase {
  variant: 'map'
  selectedKey: string | null
  onSelect: (key: string) => void
  onPlay: (key: string) => void
  onFocusStop: (stop: SceneStop) => void
  /** The stop, region or layer under the pointer; null when it leaves. */
  onPoint: (target: MapNoteTarget | null) => void
  /** The focused stop; null on blur. */
  onFocusNote: (target: MapNoteTarget | null) => void
}

/** Fig. 1 on the title page: one read-only image, cropped to `shown`. */
interface MapDrawingOverview extends DrawingBase {
  variant: 'overview'
  shown: OverviewWindow
  description: string
}

export type MapDrawingProps = MapDrawingInteractive | MapDrawingOverview

function StopMark({ stop, pulse }: { stop: SceneStop; pulse: boolean }) {
  return (
    <>
      <g transform={`translate(${stop.x} ${stop.y})`}>
        {stop.node.boss && (
          <rect x="-16" y="-16" width="32" height="32" transform="rotate(45)" className="map-fig__boss" />
        )}
        <NodeMark
          size={NODE_SIZE}
          state={stop.node.state}
          planned={stop.node.planned}
          here={stop.node.here}
          pulse={pulse && stop.node.here}
        />
        <rect className="map-node__ring" x="-21" y="-21" width="42" height="42" />
      </g>
      <MapTexts texts={stop.texts} />
    </>
  )
}

// Memoized: the map's heaviest render, and scrolling or the gauge never changes it.
export const MapDrawing = memo(function MapDrawing(props: MapDrawingProps) {
  const id = useId()
  const hatch = `${id}-hatch`
  const cross = `${id}-cross`
  const refs = useRef(new Map<string, SVGGElement>())
  const { scene, pulse } = props
  const { stops, width, height } = scene
  const map = props.variant === 'map' ? props : null
  const tabKey = map ? (map.selectedKey ?? scene.here?.key ?? stops[0]?.key) : null
  const view = props.variant === 'overview' ? props.shown : { top: 0, height }

  // One handler for the whole sheet: paint order can't hide a region band under its hatching.
  const onMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    if (!map) {
      return
    }
    const stop = event.target instanceof Element ? event.target.closest('[data-stop]') : null
    const key = stop?.getAttribute('data-stop')
    if (key) {
      map.onPoint({ kind: 'stop', key })
      return
    }
    map.onPoint(targetAt(scene.layers, event.clientY - event.currentTarget.getBoundingClientRect().top + view.top))
  }

  const move = (stop: SceneStop | undefined) => {
    if (stop) {
      refs.current.get(stop.key)?.focus({ preventScroll: true })
    }
  }

  const onKeyDown = (event: KeyboardEvent<SVGGElement>, index: number) => {
    const stop = stops[index]
    if (!stop || !map) {
      return
    }
    const layerStart = (from: number, step: number) => {
      const layerIndex = scene.layers.findIndex((layer) => layer.id === stop.layerId)
      for (let at = layerIndex + step; at >= 0 && at < scene.layers.length; at += step) {
        const first = stops.find((candidate) => candidate.layerId === scene.layers[at]?.id)
        if (first) {
          return first
        }
      }
      return stops[from]
    }
    const next = stops[Math.min(index + 1, stops.length - 1)]
    const previous = stops[Math.max(index - 1, 0)]
    const targets: Readonly<Record<string, SceneStop | undefined>> = {
      ArrowDown: next,
      ArrowRight: next,
      ArrowUp: previous,
      ArrowLeft: previous,
      Home: stops[0],
      End: stops[stops.length - 1],
    }
    if (event.key in targets) {
      event.preventDefault()
      move(targets[event.key])
    } else if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault()
      move(layerStart(index, event.key === 'PageDown' ? 1 : -1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      map.onPlay(stop.key)
    } else if (event.key === ' ') {
      event.preventDefault()
      map.onSelect(stop.key)
    }
  }

  return (
    <svg
      className={`map-fig map-fig--${props.variant}`}
      width={width}
      height={view.height}
      viewBox={`0 ${view.top} ${width} ${view.height}`}
      role={map ? 'group' : 'img'}
      aria-labelledby={`${id}-t`}
      onMouseMove={map ? onMouseMove : undefined}
      onMouseLeave={map ? () => map.onPoint(null) : undefined}
    >
      <title id={`${id}-t`}>
        {props.variant === 'overview'
          ? props.description
          : 'Kernel Map, drawn as a section through the Machine from the surface down to the hardware. Each layer lists its levels in play order.'}
      </title>
      <defs>
        <pattern id={hatch} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--hatch)" strokeWidth="1.5" />
        </pattern>
        <pattern id={cross} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="var(--hatch)" strokeWidth="1.5" />
          <line x1="0" y1="0" x2="10" y2="0" stroke="var(--hatch)" strokeWidth="1.5" />
        </pattern>
      </defs>

      {scene.layers.map((layer, index) => (
        <g key={layer.id}>
          {map && <rect x="0" y={layer.top} width={width} height={layer.bottom - layer.top} className="map-fig__hit" />}
          {layer.id === 'bedrock' ? (
            <rect
              x="0"
              y={layer.top}
              width={width}
              height={layer.bottom - layer.top}
              fill={`url(#${cross})`}
              className="map-fig__band"
            />
          ) : (
            layer.id !== 'gate' &&
            layer.tone !== 'rebuilt' && (
              <rect
                x="0"
                y={layer.top}
                width={width}
                height={layer.bottom - layer.top}
                fill={`url(#${hatch})`}
                className={`map-fig__band map-fig__band--${layer.tone}`}
              />
            )
          )}
          {index > 0 && <line x1="0" x2={width} y1={layer.top} y2={layer.top} className="map-fig__grade" />}
          {layer.panel && (
            <rect
              x={layer.panel.x}
              y={layer.panel.y}
              width={layer.panel.width}
              height={layer.panel.height}
              className="map-fig__panel"
            />
          )}
        </g>
      ))}

      {scene.gate && <MapGate gate={scene.gate} />}

      {scene.hardware && (
        <g>
          <line
            x1={scene.hardware.busLeft}
            x2={scene.hardware.busRight}
            y1={scene.hardware.busY}
            y2={scene.hardware.busY}
            className="map-fig__bus"
          />
          {scene.hardware.boxes.map((box) => (
            <g key={box.x}>
              <line
                x1={box.x + box.width / 2}
                x2={box.x + box.width / 2}
                y1={box.y + box.height}
                y2={scene.hardware?.busY}
                className="map-fig__wire"
              />
              <rect x={box.x} y={box.y} width={box.width} height={box.height} className="map-fig__hw" />
              <text x={box.x + box.width / 2} y={box.y + (box.lines.length > 1 ? 21 : 30)} textAnchor="middle">
                {box.lines.map((line, index) => (
                  <tspan key={line} x={box.x + box.width / 2} dy={index === 0 ? 0 : 15} className="map-fig__hw-lbl">
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          ))}
          <text x={scene.hardware.busLeft} y={scene.hardware.busY + 16} className="map-fig__meta">
            buses: PCI Express, USB, the CPU's own links to memory
          </text>
        </g>
      )}

      <g>
        <RoadPath road={scene.road} />
        {scene.spurs.map((spur) => (
          <path key={spur.key} d={spur.d} className={`map-fig__spur${spur.reached ? '' : ' map-fig__spur--ahead'}`} />
        ))}
        {scene.start && <circle cx={scene.start.x} cy={scene.start.y} r="6" className="map-fig__start" />}
      </g>

      {scene.layers.map((layer) =>
        map ? (
          // biome-ignore lint/a11y: an SVG <g> is neither interactive nor a fieldset; its printed words (kicker, name, progress, caption, source, guides) are the layer's summary
          <g key={layer.id} role="group" aria-label={layer.name}>
            <MapTexts texts={layer.texts} />
            {layer.regions.map((region) => (
              <MapTexts key={region.key} texts={region.texts} />
            ))}
            {stops.map((stop, index) =>
              stop.layerId !== layer.id ? null : (
                // biome-ignore lint/a11y/useSemanticElements: an SVG stop can't be a <button>; it is one by role, focus and keys
                <g
                  key={stop.key}
                  ref={(element) => {
                    if (element) {
                      refs.current.set(stop.key, element)
                    } else {
                      refs.current.delete(stop.key)
                    }
                  }}
                  role="button"
                  tabIndex={stop.key === tabKey ? 0 : -1}
                  aria-label={`${stop.node.number} ${stop.node.title}${stop.node.side ? ', side level' : ''}${stop.node.boss ? ', boss' : ''}, ${stop.node.status}`}
                  aria-describedby={`${id}-d${index}`}
                  aria-pressed={stop.key === map.selectedKey}
                  data-stop={stop.key}
                  className={`map-node${stop.key === map.selectedKey ? ' map-node--selected' : ''}`}
                  onClick={() => map.onSelect(stop.key)}
                  onDoubleClick={() => map.onPlay(stop.key)}
                  onFocus={() => {
                    map.onSelect(stop.key)
                    map.onFocusStop(stop)
                    map.onFocusNote({ kind: 'stop', key: stop.key })
                  }}
                  onBlur={() => map.onFocusNote(null)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                >
                  <desc id={`${id}-d${index}`}>{stop.node.summary}</desc>
                  <StopMark stop={stop} pulse={pulse} />
                </g>
              )
            )}
          </g>
        ) : (
          <g key={layer.id}>
            <MapTexts texts={layer.texts} />
            {layer.regions.map((region) => (
              <MapTexts key={region.key} texts={region.texts} />
            ))}
            {stops.map((stop) =>
              stop.layerId !== layer.id ? null : <StopMark key={stop.key} stop={stop} pulse={pulse} />
            )}
          </g>
        )
      )}

      {scene.here && (
        <HereFlag stop={scene.here} nodeSize={NODE_SIZE} bounds={{ left: EDGE, right: width - EDGE, top: 0 }} />
      )}
    </svg>
  )
})
