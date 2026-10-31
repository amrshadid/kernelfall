import type { GaugeLayer, GaugeSegment, LayerSpan, MapScene, SceneStop, ScrollFrame } from '@features/map/types'
import {
  ACTIVE_AT,
  gaugeAt,
  gaugeLayersOf,
  gaugeSegments,
  gaugeWindow,
  HERE_AT,
  KEEP_IN_VIEW_BOTTOM,
  KEEP_IN_VIEW_TOP,
  layerAt,
  layoutMap,
} from '@features/map/utils/layout'
import type { LayerId, MapLayer } from '@shared/types'
import { type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useMapScroller } from './useMapScroller.hook'

export interface UseMapGaugeResult {
  readonly scrollerRef: (element: HTMLDivElement | null) => void
  /** null until the scroller has a width to lay the drawing out at. */
  readonly scene: MapScene | null
  /** Moved through `--view-start`/`--view-size`, so scrolling never renders. */
  readonly viewBar: RefObject<HTMLSpanElement | null>
  readonly active: LayerId | null
  readonly gaugeLayers: readonly GaugeLayer[]
  /** "You are here" as a fraction of the gauge; null when nowhere. */
  readonly here: number | null
  readonly jumpTo: (id: LayerId) => void
  readonly findHere: () => void
  readonly keepInView: (stop: SceneStop) => void
}

// Scrolling paints the gauge straight from the scroll; only a change of layer in view renders.
export function useMapGauge(layers: readonly MapLayer[], reducedMotion: boolean): UseMapGaugeResult {
  const viewBar = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState<LayerId | null>(null)

  // A ref, so `paint` stays stable and the scroll handler is never re-subscribed.
  const gauge = useRef<{ spans: readonly LayerSpan[]; segments: readonly GaugeSegment[] } | null>(null)
  const paint = useCallback(({ top, view }: ScrollFrame) => {
    const laidOut = gauge.current
    if (!laidOut || view === 0) {
      return
    }
    const shown = gaugeWindow(top, view, laidOut.spans, laidOut.segments)
    viewBar.current?.style.setProperty('--view-start', String(shown.start))
    viewBar.current?.style.setProperty('--view-size', String(shown.size))
    // Same layer, same state: React skips the render.
    setActive(layerAt(top + view * ACTIVE_AT, laidOut.spans))
  }, [])

  const { ref: scrollerRef, scrollTo, read, width, view } = useMapScroller(paint)
  // Laid out at the scroller's own width so text is drawn at its real size.
  const scene = useMemo(() => (width > 0 ? layoutMap(layers, width) : null), [layers, width])
  const segments = useMemo(() => (scene ? gaugeSegments(scene.layers) : []), [scene])

  // A new layout moves every mark: repaint before the browser shows it.
  useLayoutEffect(() => {
    gauge.current = scene ? { spans: scene.layers, segments } : null
    paint(read())
  }, [scene, segments, paint, read])

  const arrived = useRef(false)
  const smooth = !reducedMotion
  const hereY = scene?.here?.y ?? null
  useEffect(() => {
    if (hereY !== null && !arrived.current && view > 0) {
      arrived.current = true
      scrollTo(hereY, smooth, HERE_AT)
    }
  }, [hereY, view, scrollTo, smooth])

  const gaugeLayers = useMemo(() => gaugeLayersOf(layers, segments), [layers, segments])
  const here = scene?.here ? gaugeAt(scene.here.y, scene.layers, segments) : null

  // Stable, so the memoized drawing skips the gauge's and the note's renders.
  const keepInView = useCallback(
    (stop: SceneStop) => {
      const { top, view: height } = read()
      if (stop.y - KEEP_IN_VIEW_TOP < top || stop.y + KEEP_IN_VIEW_BOTTOM > top + height) {
        scrollTo(stop.y, smooth, HERE_AT)
      }
    },
    [read, scrollTo, smooth]
  )

  const jumpTo = (id: LayerId) => {
    const layer = scene?.layers.find((candidate) => candidate.id === id)
    if (layer) {
      scrollTo(layer.top, smooth, 0)
    }
  }

  const findHere = () => {
    if (scene?.here) {
      scrollTo(scene.here.y, smooth, HERE_AT)
    }
  }

  return {
    scrollerRef,
    scene,
    viewBar,
    active,
    gaugeLayers,
    here,
    jumpTo,
    findHere,
    keepInView,
  }
}
