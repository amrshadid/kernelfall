import type { MapScene, OverviewWindow } from '@features/map/types'
import { layoutMap, overviewWindow } from '@features/map/utils/layout'
import type { MapLayer } from '@shared/types'
import { useMemo } from 'react'
import { useMapScroller } from './useMapScroller.hook'

export interface UseMapOverviewResult {
  readonly frameRef: (element: HTMLDivElement | null) => void
  /** null until the frame has a size to lay the drawing out at. */
  readonly scene: MapScene | null
  readonly shown: OverviewWindow | null
}

export function useMapOverview(layers: readonly MapLayer[]): UseMapOverviewResult {
  const { ref, width, view } = useMapScroller()
  const scene = useMemo(() => (width > 0 ? layoutMap(layers, width, 'overview') : null), [layers, width])
  const shown = useMemo(() => (scene && view > 0 ? overviewWindow(scene, view) : null), [scene, view])
  return { frameRef: ref, scene, shown }
}
