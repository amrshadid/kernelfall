import type { LevelCard } from '@features/level/types'
import type { UseLevelActionsResult } from '@kernelfall/game/hooks'
import type { LevelDefinition, LevelRunState } from '@kernelfall/game/types'
import type { LevelLabel, LoadedContent, Story } from '@kernelfall/levels/types'
import { labelOf } from '@kernelfall/levels/utils'
import type { Route } from '@shared/navigation'
import { DEFAULT_HEADLINE, SENTENCE_END } from './level-card.constants'

export interface CardInput {
  readonly level: LevelDefinition
  readonly label: LevelLabel
  readonly run: LevelRunState
  readonly passing: number
  readonly taint: number
  readonly story: Story | undefined
  readonly content: LoadedContent
  /** Files the card: the level loop's step from Card to complete. */
  readonly next: UseLevelActionsResult['next']
  readonly navigate: (route: Route) => void
  /** Plays this level again from its scene. */
  readonly replay: () => void
}

export function levelCardOf(input: CardInput): LevelCard {
  const { level, label, run, passing, taint, story, content, next, navigate, replay } = input
  const debrief = story?.get('debrief')?.find((block) => block.kind === 'line')
  const nextId = content.nextLevel(level.id)
  const nextLabel = nextId ? labelOf(content, nextId) : null
  const finish = async (go: () => void) => {
    // The card is filed before leaving, so Continue never comes back to it.
    if (run.phase === 'card') {
      await next()
    }
    go()
  }
  const helped = run.outcome?.via === 'reference'
  return {
    cards: level.codex,
    simplified: level.fidelity.simplified,
    seenIn: label.heading,
    headline: debrief?.text.split(SENTENCE_END)[0] ?? DEFAULT_HEADLINE,
    result: [
      helped ? "Completed with init's version" : 'Level complete',
      `${passing} of ${level.objectives.length}`,
      taint === 0 ? 'Taint 0, clean' : `Taint ${taint}`,
    ].join(' · '),
    next:
      nextId && nextLabel
        ? {
            label: `Next level: ${nextLabel.heading}`,
            onSelect: () => void finish(() => navigate({ name: 'play', levelId: nextId })),
          }
        : null,
    onMap: () => void finish(() => navigate({ name: 'map' })),
    onReplay: () => void finish(replay),
  }
}
