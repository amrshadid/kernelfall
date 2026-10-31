import { appConfig } from '@app/config'
import { AppRouter } from '@app/routing'
import { useShareRecordings } from '@app/store'
import { ThemeSync } from '@app/theme'
import { useClarity } from '@features/analytics/hooks/clarity'
import { NoticesContainer } from '@features/notices'
import { useShortcutListener } from '@features/shortcuts/hooks/keys'
import { cleanupGameListeners, setupGameListeners } from '@kernelfall/game'
import { useLevelActions, useSaveActions } from '@kernelfall/game/hooks'
import { cleanupMachineListeners, setupMachineListeners } from '@kernelfall/machine'
import { useEffect } from 'react'

export const AppProviders = () => {
  const { open, saveNow } = useSaveActions()
  const { recordActivity } = useLevelActions()

  useEffect(() => {
    // Listeners first: opening the save emits events the game's autosave listens for.
    setupMachineListeners()
    setupGameListeners()
    void open()
    return () => {
      cleanupGameListeners()
      cleanupMachineListeners()
    }
  }, [open])

  useEffect(() => {
    const flush = () => {
      recordActivity()
      void saveNow()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flush()
      }
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [saveNow, recordActivity])

  useShortcutListener()
  useClarity(appConfig().clarityId, useShareRecordings())

  return (
    <>
      <ThemeSync />
      <AppRouter />
      <NoticesContainer />
    </>
  )
}
