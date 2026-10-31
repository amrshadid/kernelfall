import type { GuideAction, GuideCheckReport, GuideChip, GuidePlacement, LevelGuide } from '@features/level/types'
import type { UseLevelCheckResult } from '@kernelfall/game/hooks'
import { type CommandChip, HINT_TIERS, type LevelDefinition, type LevelRunState } from '@kernelfall/game/types'
import type { StoryBlock } from '@kernelfall/levels/types'
import { hrefOf } from '@shared/navigation'
import type { StepId } from '@shared/types'
import { STEPS } from '@shared/utils/level'
import { BUILD_NOTES, HELD_PASS_LINE, HINT_TIER_NAMES, MAN_PAGE, WHOLE_LINE } from './level-guide.constants'

export interface GuideInput {
  readonly level: LevelDefinition
  readonly run: LevelRunState
  /** The story the Guide shows for the step on screen. */
  readonly blocks: readonly StoryBlock[]
  /** The step on screen: the current one, or the one looked back at. */
  readonly shown: StepId
  readonly reviewing: StepId | null
  readonly objectives: LevelGuide['objectives']
  readonly check: Pick<UseLevelCheckResult, 'verdict' | 'heldTaint' | 'hasChecker'>
  readonly actions: readonly GuideAction[]
  readonly runChip: (commandLine: string) => void
  readonly placement: GuidePlacement | null
}

/** The checker's verdict so far, while building; null before the first judged run. */
export function checkReportOf(
  run: LevelRunState,
  check: GuideInput['check'],
  objectiveCount: number
): GuideCheckReport | null {
  const { verdict } = check
  if (verdict === null || run.phase !== 'build') {
    return null
  }
  return {
    heading: `run ${run.attempts} · ${objectiveCount - verdict.missing.length} of ${objectiveCount} met`,
    missing: verdict.missing.map((objective) => objective.text),
    taint: verdict.taint.map((event) => `${event.ruleId}: ${event.detail}`),
    held: check.heldTaint.length > 0 ? HELD_PASS_LINE : null,
  }
}

/** Only while building. */
export function buildNoteOf(building: boolean, hasChecker: boolean): string | null {
  if (!building) {
    return null
  }
  return hasChecker ? BUILD_NOTES.checked : BUILD_NOTES.unchecked
}

/** The level's chips; a bare name (`wc`) only names the tool, since run alone it may wait for input. */
export function chipsOf(chips: readonly CommandChip[], runChip: (commandLine: string) => void): readonly GuideChip[] {
  return chips.map((chip) => ({
    command: chip.command,
    explain: chip.explain,
    onRun: WHOLE_LINE.test(chip.command) ? () => runChip(chip.command) : null,
  }))
}

export function guideOf(input: GuideInput): LevelGuide {
  const { level, run, blocks, shown, reviewing, check } = input
  const label = STEPS.find((step) => step.id === shown)?.label ?? ''
  const building = (run.phase === 'build' || run.phase === 'oops') && !reviewing
  return {
    stepLabel: label,
    reviewNote: reviewing ? `Looking again at ${label}. Your progress is kept.` : null,
    lines: blocks.flatMap((block) => (block.kind === 'line' ? [{ speaker: block.speaker, text: block.text }] : [])),
    code: blocks.flatMap((block) => (block.kind === 'code' ? [block.text] : [])),
    showObjectives: true,
    objectives: input.objectives,
    checkReport: reviewing ? null : checkReportOf(run, check, level.objectives.length),
    chips: building ? chipsOf(level.chips ?? [], input.runChip) : [],
    placement: shown === 'scene' && !reviewing ? input.placement : null,
    hints: level.hints.slice(0, run.hintsRevealed).map((text, index) => ({
      tier: HINT_TIER_NAMES[HINT_TIERS[index] ?? 'nudge'],
      text,
    })),
    seeAlso: level.codex
      .filter((card) => MAN_PAGE.test(card.term))
      .map((card) => ({ term: card.term, href: card.docs })),
    codex: level.codex.map((card) => ({
      id: card.id,
      term: card.term,
      // Over the level, not the Codex screen: reading a card never leaves the mission.
      href: hrefOf({ name: 'play', levelId: level.id, card: card.id }),
    })),
    actions: input.actions,
    note: buildNoteOf(building, check.hasChecker),
  }
}
