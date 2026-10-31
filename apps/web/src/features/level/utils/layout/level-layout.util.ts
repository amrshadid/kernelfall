import type {
  GuideAction,
  GuidePlacement,
  LevelDialogs,
  LevelLayoutModel,
  LevelSlots,
  PanelLayout,
  Panels,
} from '@features/level/types'
import { guideActionsOf } from '@features/level/utils/actions'
import { levelCardOf } from '@features/level/utils/card'
import { guideOf } from '@features/level/utils/guide'
import { currentStepOf, guideLinesFor, objectiveStates } from '@features/level/utils/view'
import type { UseLevelActionsResult, UseLevelCheckResult } from '@kernelfall/game/hooks'
import { HINT_TIERS, type LevelDefinition, type LevelRunState, type TaintEntry } from '@kernelfall/game/types'
import { isHintOffered } from '@kernelfall/game/utils'
import type { LevelLabel, LoadedContent } from '@kernelfall/levels/types'
import type { VmStatus } from '@kernelfall/machine/types'
import { hrefOf, type Route } from '@shared/navigation'
import type { SaveState, ScreenChrome } from '@shared/types'
import { STEPS, stepIndexOf } from '@shared/utils/level'
import { shortActName } from '@shared/utils/map'
import { MACHINE_STATUS, TERMINAL_LABELS } from './level-layout.constants'

export interface LevelLayoutInput {
  readonly chrome: ScreenChrome
  readonly content: LoadedContent
  readonly level: LevelDefinition
  readonly label: LevelLabel
  readonly run: LevelRunState
  readonly taint: number
  readonly taintEntries: readonly TaintEntry[]
  readonly check: Pick<UseLevelCheckResult, 'verdict' | 'heldTaint' | 'hasChecker'>
  readonly panels: Panels
  readonly panelSizes: PanelLayout
  readonly slots: LevelSlots
  readonly dialogs: LevelDialogs
  readonly hintEnabled: boolean
  readonly actions: Pick<UseLevelActionsResult, 'next' | 'revealHint' | 'fixFirst' | 'acceptTaint' | 'respawn'>
  readonly continueWithReference: () => Promise<void>
  /** The Next shortcut as the player's OS prints it ("⌥N", "Alt+N"). */
  readonly nextKeys: string
  readonly machine: VmStatus
  readonly save: SaveState
  readonly savedAgoMs: number | null
  readonly onShortcuts: () => void
  readonly navigate: (route: Route) => void
  /** Runs a chip's command line in the terminal, as if typed. */
  readonly runChip: (commandLine: string) => void
  readonly placement: GuidePlacement | null
  /** Plays the level again from its scene, on a fresh Machine. */
  readonly replay: () => void
  /** Reboots through GRUB, keeping the level's progress. */
  readonly restart: () => void
}

/** The level screen for a ready run: top bar, Guide, panels, card, dialogs and status bar. */
export function levelLayoutOf(input: LevelLayoutInput): LevelLayoutModel {
  const { level, label, run, dialogs, taint, actions, check, content } = input
  const { phase } = run
  const current = currentStepOf(phase)
  const shown = dialogs.reviewing ?? current
  const story = content.stories.get(level.id)
  const objectives = objectiveStates(level.objectives, run)
  const passing = objectives.filter((objective) => objective.passed).length
  const sheet = Math.min(stepIndexOf(phase), STEPS.length - 1)
  const back: GuideAction = {
    id: 'back',
    label: `Back to ${STEPS[stepIndexOf(phase)]?.label ?? 'the level'}`,
    kind: 'primary',
    onSelect: () => dialogs.review(null),
  }

  return {
    chrome: input.chrome,
    panelSizes: input.panelSizes,
    page: `${label.title}(${label.number})`,
    volume: `Kernelfall Service Manual · ${label.actName} · ${label.regionName}`,
    bar: {
      mapHref: hrefOf({ name: 'map' }),
      heading: label.heading,
      subheading: `${shortActName(label.actName)} · ${label.regionName}`,
      steps: STEPS,
      currentIndex: stepIndexOf(phase),
      reviewing: dialogs.reviewing,
      onReview: (stepId) => {
        const step = STEPS.find((candidate) => candidate.id === stepId)
        if (step) {
          dialogs.toggleReview(step.id)
        }
      },
      taint,
      onOpenTaint: () => dialogs.setTaintOpen(true),
      hintsLeft: HINT_TIERS.length - run.hintsRevealed,
      hintOffered: isHintOffered(run.attempts),
      hintEnabled: input.hintEnabled,
      onHint: () => void actions.revealHint(),
      onReplay: () => dialogs.setReplayOpen(true),
    },
    guide: guideOf({
      level,
      run,
      blocks: guideLinesFor(shown, story),
      shown,
      reviewing: dialogs.reviewing,
      objectives,
      check,
      runChip: input.runChip,
      placement: input.placement,
      actions: dialogs.reviewing
        ? [back]
        : guideActionsOf(run, {
            moves: actions,
            askReference: () => dialogs.setReferenceOpen(true),
            heldWithTaint: check.heldTaint.length > 0,
            nextKeys: input.nextKeys,
            restart: level.lab?.boot ? input.restart : null,
          }),
    }),
    panels: { ...input.panels, emphasis: current },
    slots: input.slots,
    terminalLabel: level.act === 'prologue' ? TERMINAL_LABELS.prologue : TERMINAL_LABELS.default,
    terminalStatus: input.machine.detail,
    titleBlock: [
      { label: 'Drawing', value: label.regionName },
      { label: 'Level', value: `${label.number} · ${level.skills[0] ?? level.id}` },
      { label: 'Sheet', value: `${sheet + 1} of ${STEPS.length}, ${STEPS[sheet]?.label}` },
      {
        label: 'Revision (Taint)',
        value: taint === 0 ? '0, clean' : String(taint),
        tone: taint === 0 ? 'good' : 'taint',
      },
    ],
    card:
      phase === 'card' || phase === 'complete'
        ? levelCardOf({
            level,
            label,
            run,
            passing,
            taint,
            story,
            content,
            next: actions.next,
            navigate: input.navigate,
            replay: input.replay,
          })
        : null,
    taintReport: {
      open: dialogs.taintOpen,
      onClose: () => dialogs.setTaintOpen(false),
      entries: input.taintEntries.map((entry) => ({ id: entry.ruleId, points: entry.points, detail: entry.detail })),
    },
    reference: {
      open: dialogs.referenceOpen,
      onCancel: () => dialogs.setReferenceOpen(false),
      onConfirm: () => {
        dialogs.setReferenceOpen(false)
        void input.continueWithReference()
      },
    },
    replay: {
      open: dialogs.replayOpen,
      onCancel: () => dialogs.setReplayOpen(false),
      onConfirm: () => {
        dialogs.setReplayOpen(false)
        input.replay()
      },
    },
    status: {
      save: input.save,
      savedAgoMs: input.savedAgoMs,
      machine: MACHINE_STATUS[input.machine.phase],
      onShortcuts: input.onShortcuts,
    },
  }
}
