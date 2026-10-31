import type { Route } from '@shared/navigation'
import type { ReactNode } from 'react'
import { CodexPage, LevelPage, MapPage, NotFoundPage, PlacementPage, SettingsPage, TitlePage } from '@/pages'

/** Every area page is a lazy chunk fetched when first visited. */
export function routeElement(route: Route): ReactNode {
  switch (route.name) {
    case 'title':
      return <TitlePage />
    case 'map':
      return <MapPage />
    case 'play':
      // A new key per level: the machine and the level's state start fresh.
      return <LevelPage key={route.levelId} levelId={route.levelId} cardId={route.card ?? null} />
    case 'codex':
      return <CodexPage cardId={route.cardId} />
    case 'settings':
      return <SettingsPage section={route.section} />
    case 'placement':
      return <PlacementPage key={`${route.act}/${route.regionId}`} act={route.act} regionId={route.regionId} />
    case 'not-found':
      return <NotFoundPage />
  }
}
