import type { Panels } from '@features/level/types'
import type { Act, LevelPhase, LevelRunState, Objective } from '@kernelfall/game/types'
import type { StoryBlock } from '@kernelfall/levels/types'
import type { StepId } from '@shared/types'
import { STEPS, stepIndexOf } from '@shared/utils/level'
import { SECTION_FOR_STEP } from './level-view.constants'

export interface PanelInput {
  readonly act: Act
  readonly phase: LevelPhase
  /** Any level completed: unlocks are saved, so replaying an early level never hides panels. */
  readonly anyCompleted: boolean
  readonly showAllPanels: boolean
  /** The level lists at least one X-ray view; P.1 lists none, before X-ray exists in the story. */
  readonly hasXray: boolean
  /** The level has starter files: a level of commands only (P.1) never shows an editor. */
  readonly hasEditor: boolean
}

export interface ObjectiveState {
  readonly id: string
  readonly text: string
  readonly passed: boolean
}

const BUILD_INDEX = stepIndexOf('build')
const SEE_INDEX = stepIndexOf('see')

/** Panels are absent, not greyed out, until the story introduces them. */
export function panelsFor(input: PanelInput): Panels {
  if (input.showAllPanels || input.anyCompleted || input.act !== 'prologue') {
    return { editor: input.hasEditor, xray: input.hasXray }
  }
  const step = stepIndexOf(input.phase)
  return { editor: input.hasEditor && step >= BUILD_INDEX, xray: input.hasXray && step >= SEE_INDEX }
}

/** The step's own section, else the closest one before it. */
export function guideLinesFor(
  step: StepId,
  story: ReadonlyMap<string, readonly StoryBlock[]> | undefined
): readonly StoryBlock[] {
  for (const section of SECTION_FOR_STEP[step]) {
    const blocks = story?.get(section)
    if (blocks && blocks.length > 0) {
      return blocks
    }
  }
  return []
}

/** Objectives tick from the checker's last verdict; a completed run has them all. */
export function objectiveStates(objectives: readonly Objective[], run: LevelRunState): readonly ObjectiveState[] {
  const missing = new Set(run.lastVerdict?.missing.map((objective) => objective.id))
  return objectives.map((objective) => ({
    id: objective.id,
    text: objective.text,
    passed: run.outcome !== null || (run.lastVerdict !== null && !missing.has(objective.id)),
  }))
}

/** `complete` shows the card. */
export function currentStepOf(phase: LevelPhase): StepId {
  return STEPS[Math.min(stepIndexOf(phase), STEPS.length - 1)]?.id ?? 'scene'
}
