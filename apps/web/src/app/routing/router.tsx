import { CheatSheetContainer } from '@features/shortcuts'
import { useShortcut } from '@features/shortcuts/hooks/keys'
import { useWideEnough } from '@features/small-screen/hooks/viewport'
import { useProgress, useSaveActions } from '@kernelfall/game/hooks'
import { appContent } from '@kernelfall/levels/utils'
import { useHashRoute, useRouteFocus } from '@shared/hooks/navigation'
import { screenTitleOf } from '@shared/navigation'
import { Suspense, useEffect } from 'react'
import { ContentErrorPage, SmallScreenPage } from '@/pages'
import { routeElement } from './routerConfig'

export function AppRouter() {
  const route = useHashRoute()
  const content = appContent()
  const wide = useWideEnough()
  const { isOpening } = useProgress()
  const { saveNow } = useSaveActions()
  useShortcut('save', () => void saveNow())

  const title = screenTitleOf(route, content.ok ? content.value : null, wide)
  useEffect(() => {
    document.title = title
  }, [title])

  useRouteFocus(route, wide)

  // Content that fails its checks could teach something wrong: nothing else renders.
  if (!content.ok) {
    return <ContentErrorPage />
  }
  // Below the play width the route is kept, not rendered: widening the window brings it back.
  if (!wide) {
    return <SmallScreenPage />
  }
  // Nothing that shows progress renders before the save is loaded.
  if (isOpening) {
    return null
  }
  return (
    <>
      <Suspense fallback={null}>{routeElement(route)}</Suspense>
      <CheatSheetContainer />
    </>
  )
}
