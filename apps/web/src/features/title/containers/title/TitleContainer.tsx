import { appConfig } from '@app/config'
import { useCheatSheet } from '@app/store'
import { useSaveStatus } from '@features/chrome/hooks/save'
import { useScreenChrome } from '@features/chrome/hooks/screen'
import { useContent } from '@features/content/hooks/content'
import { useMapMotion } from '@features/map/hooks/drawing'
import { overviewDescription } from '@features/map/utils/layout'
import { TitlePresentation } from '@features/title/components/title'
import { useEnterActivatesPrimary, useNewGame } from '@features/title/hooks/title'
import { continueTargetOf, lastPlayedText, titleContentsOf } from '@features/title/utils/contents'
import { volumeOf } from '@features/title/utils/volume'
import { useTourScreen } from '@features/tour/hooks/tour'
import { useContinue, useKernelMap, useProgress, useProgressSummary } from '@kernelfall/game/hooks'
import { labelOf } from '@kernelfall/levels/utils'
import { useNow } from '@shared/hooks/time'
import { hrefOf } from '@shared/navigation'
import { saveStatusText } from '@shared/utils/format'
import { currentAct, mapLayers, mapNodes, shortActName } from '@shared/utils/map'
import { useMemo } from 'react'

export function TitleContainer() {
  const chrome = useScreenChrome()
  useTourScreen('title')
  const content = useContent()
  const { progress } = useProgress()
  const { saveState, lastSavedAt } = useSaveStatus()
  const continueTarget = useContinue()
  const summary = useProgressSummary()
  const map = useKernelMap()
  const { openCheatSheet } = useCheatSheet()
  const now = useNow()
  const reducedMotion = useMapMotion()

  const hasSave = progress.levels.length > 0
  const { confirming, newGame, startOver, cancel } = useNewGame({ hasSave, firstLevel: content.game.levels[0]?.id })
  useEnterActivatesPrimary(!confirming)

  const target = hasSave ? continueTarget : null
  const label = target ? labelOf(content, target.levelId) : null
  // Fig. 1 is the Kernel Map itself, from the same nodes, so "you are here" is where Continue goes.
  const hereId = continueTarget?.levelId ?? null
  const nodes = useMemo(() => mapNodes(content, map, hereId), [content, map, hereId])
  const layers = useMemo(() => mapLayers(content, nodes), [content, nodes])
  const act = currentAct(nodes)
  // The act the player is in names the manual's volume and the Kernel Map's progress.
  const fullActName = (content.acts.find((outline) => outline.act === act) ?? content.acts[0])?.name ?? ''

  return (
    <TitlePresentation
      chrome={chrome}
      volume={volumeOf(fullActName)}
      continueTo={
        target && label ? continueTargetOf({ target, label, lastPlayed: lastPlayedText(now, lastSavedAt) }) : null
      }
      onNewGame={newGame}
      contents={titleContentsOf({
        actName: shortActName(fullActName),
        actSummary: summary.acts.find((entry) => entry.act === act),
        codexCards: summary.codexCards,
        onNewGame: newGame,
      })}
      figure={{
        layers,
        description: overviewDescription(layers),
        href: hrefOf({ name: 'map' }),
        pulse: !reducedMotion,
      }}
      newGame={{
        open: confirming,
        onCancel: cancel,
        onStart: () => void startOver(false),
        onExportAndStart: () => void startOver(true),
      }}
      saveText={saveStatusText(saveState, lastSavedAt === null ? null : now - lastSavedAt)}
      onShortcuts={openCheatSheet}
      recorded={appConfig().clarityId !== null}
      privacyHref={hrefOf({ name: 'settings', section: 'privacy' })}
    />
  )
}
