import type { GaugeLayer } from '@features/map/types'
import type { LayerId } from '@shared/types'
import { type KeyboardEvent, type Ref, useRef } from 'react'
import './DepthGauge.css'

export interface DepthGaugeProps {
  layers: readonly GaugeLayer[]
  /** The layer in view. */
  current: LayerId | null
  /** Moved by its owner through `--view-start`/`--view-size`, so scrolling never renders the gauge. */
  viewRef: Ref<HTMLSpanElement>
  /** Fraction of the gauge; null when nowhere. */
  here: number | null
  onJump: (id: LayerId) => void
  onFindHere: () => void
  /** null when left. */
  onHover: (id: LayerId | null) => void
  /** null on blur. */
  onFocusLayer: (id: LayerId | null) => void
}

const pct = (fraction: number) => `${(fraction * 100).toFixed(2)}%`

export function DepthGauge({
  layers,
  current,
  viewRef,
  here,
  onJump,
  onFindHere,
  onHover,
  onFocusLayer,
}: DepthGaugeProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key]
    if (step !== undefined) {
      event.preventDefault()
      refs.current[Math.min(Math.max(index + step, 0), layers.length - 1)]?.focus()
    }
  }

  return (
    <nav className="map-gauge" aria-label="Depth gauge">
      <p className="map-gauge__head" aria-hidden="true">
        Depth
      </p>
      <div className="map-gauge__shaft">
        <ol className="map-gauge__scale">
          {layers.map((layer, index) => (
            <li key={layer.id} className="map-gauge__seg" style={{ top: pct(layer.start), height: pct(layer.size) }}>
              <button
                ref={(element) => {
                  refs.current[index] = element
                }}
                type="button"
                className={`map-gauge__layer map-gauge__layer--${layer.tone}`}
                aria-current={layer.id === current ? 'location' : undefined}
                aria-label={`${layer.short}${layer.count === '' ? '' : `, ${layer.count} rebuilt`}`}
                onClick={() => onJump(layer.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                onFocus={() => onFocusLayer(layer.id)}
                onBlur={() => onFocusLayer(null)}
                onMouseEnter={() => onHover(layer.id)}
                onMouseLeave={() => onHover(null)}
              >
                <span className="map-gauge__name">{layer.short}</span>
                {layer.count !== '' && <span className="map-gauge__count">{layer.count}</span>}
              </button>
            </li>
          ))}
        </ol>
        <span ref={viewRef} className="map-gauge__view" aria-hidden="true" />
        {here !== null && (
          <span className="map-gauge__here" style={{ top: pct(here) }} aria-hidden="true">
            You
          </span>
        )}
      </div>
      <button type="button" className="map-gauge__find" onClick={onFindHere} disabled={here === null}>
        Find me
      </button>
    </nav>
  )
}
