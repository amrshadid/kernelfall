import { lazy } from 'react'

export const PlacementPage = lazy(() => import('./PlacementPage').then((m) => ({ default: m.PlacementPage })))
