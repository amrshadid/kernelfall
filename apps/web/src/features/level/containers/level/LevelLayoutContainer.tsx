import { useCheatSheet, usePanelSizes, useShowAllPanels } from '@app/store'
import { useSaveStatus } from '@features/chrome/hooks/save'
import { useScreenChrome } from '@features/chrome/hooks/screen'
import { useContent } from '@features/content/hooks/content'
import { LevelScreenPresentation } from '@features/level/components/layout'
import { useLevelDialogs, useLevelShortcuts } from '@features/level/hooks/layout'
import { useLevelRun, useReferenceRun } from '@features/level/hooks/run'
import { levelLayoutOf } from '@features/level/utils/layout'
import { panelsFor, UNAVAILABLE_REASONS } from '@features/level/utils/view'
import { shortcutLabelOf } from '@features/shortcuts/utils/keys'
import { useTourScreen } from '@features/tour/hooks/tour'
import { useActiveLevel, useLevelActions, useLevelCheck, useProgress } from '@kernelfall/game/hooks'
import type { LevelId } from '@kernelfall/game/types'
import { placementOfferAt } from '@kernelfall/game/utils'
import { labelOf } from '@kernelfall/levels/utils'
import { useMachineSetup, useMachineStatus, useTerminalCommand } from '@kernelfall/machine/hooks'
import { useNow } from '@shared/hooks/time'
import { hrefOf, navigateTo } from '@shared/navigation'
import { STEPS, stepIndexOf } from '@shared/utils/level'
import { type ReactNode, useState } from 'react'

export interface LevelLayoutContainerProps {
  levelId: LevelId
  editor: ReactNode
  terminal: ReactNode
  xray: ReactNode
}

export function LevelLayoutContainer({ levelId, editor, terminal, xray }: LevelLayoutContainerProps) {
  const opening = useLevelRun(levelId)
  const { progress } = useProgress()
  const actions = useLevelActions()
  const continueWithReference = useReferenceRun(levelId)
  const active = useActiveLevel()
  const check = useLevelCheck()
  const { saveState, lastSavedAt } = useSaveStatus()
  const content = useContent()
  const chrome = useScreenChrome()
  const showAllPanels = useShowAllPanels()
  const { sizes: panelSizes, setPanelSize } = usePanelSizes()
  const { openCheatSheet } = useCheatSheet()
  const machine = useMachineStatus()
  const command = useTerminalCommand()
  const now = useNow()

  const run = opening.status === 'ready' ? opening.run : null
  const level = content.game.level(levelId)
  const offer = placementOfferAt(content.acts, levelId, progress)
  const label = labelOf(content, levelId)
  const phase = run?.phase ?? 'scene'
  const dialogs = useLevelDialogs(phase)
  // Every level starts from the clean Machine with its own accounts, files and cwd; a replay too.
  const [replays, setReplays] = useState(0)
  useMachineSetup(level?.lab, `${levelId}#${replays}`)
  // Each new step can open a panel (X-ray, the editor), which gets its own tour stop once.
  useTourScreen('level', run ? phase : 'opening')

  // The active level is this one once the run is ready (useLevelRun).
  const can = (type: 'next' | 'reveal_hint') => run !== null && active.allowed.has(type)
  useLevelShortcuts({
    enabled: run !== null,
    canNext: can('next'),
    canHint: can('reveal_hint'),
    actions,
    doneSteps: STEPS.slice(0, stepIndexOf(phase)).map((step) => step.id),
    reviewing: dialogs.reviewing,
    review: dialogs.review,
  })

  if (opening.status === 'unavailable' || !level || !label) {
    return (
      <LevelScreenPresentation
        layout={null}
        unavailable={{
          reason: UNAVAILABLE_REASONS[opening.status === 'unavailable' ? opening.reason : 'missing'],
          mapHref: hrefOf({ name: 'map' }),
        }}
      />
    )
  }
  if (!run) {
    return <LevelScreenPresentation layout={null} unavailable={null} />
  }

  return (
    <LevelScreenPresentation
      unavailable={null}
      layout={levelLayoutOf({
        chrome,
        content,
        level,
        label,
        run,
        taint: active.taint,
        taintEntries: active.taintEntries,
        check,
        panels: panelsFor({
          act: level.act,
          phase,
          anyCompleted: progress.completionOrder.length > 0,
          showAllPanels,
          hasXray: level.xray.length > 0,
          hasEditor: Object.keys(content.starters.get(level.id) ?? {}).length > 0,
        }),
        panelSizes: { sizes: panelSizes, onResize: setPanelSize },
        slots: { editor, terminal, xray },
        dialogs,
        hintEnabled: can('reveal_hint'),
        actions,
        continueWithReference,
        nextKeys: shortcutLabelOf('next-step'),
        machine,
        save: saveState,
        savedAgoMs: lastSavedAt === null ? null : now - lastSavedAt,
        onShortcuts: openCheatSheet,
        navigate: navigateTo,
        runChip: command.run,
        replay: () => {
          void actions.replay(levelId)
          setReplays((count) => count + 1)
        },
        placement: offer
          ? {
              offer: offer.check.offer,
              minutes: offer.check.minutes,
              href: hrefOf({ name: 'placement', act: offer.act, regionId: offer.regionId }),
            }
          : null,
      })}
    />
  )
}
