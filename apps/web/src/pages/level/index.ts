import { lazy } from 'react'

export const LevelPage = lazy(() => import('./LevelPage').then((m) => ({ default: m.LevelPage })))
