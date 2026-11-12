import type { LevelCard } from '@features/level/types'
import type { UseLevelActionsResult, UseRecallResult } from '@kernelfall/game/hooks'
import type { LevelDefinition, LevelRunState } from '@kernelfall/game/types'
import type { LevelLabel, LoadedContent, Story } from '@kernelfall/levels/types'
import { labelOf } from '@kernelfall/levels/utils'
import type { Route } from '@shared/navigation'
import { DEFAULT_HEADLINE, RECALL_HOW, SENTENCE_END } from './level-card.constants'

export interface CardInput {
  readonly level: LevelDefinition
  readonly label: LevelLabel
  readonly run: LevelRunState
  readonly passing: number
  readonly taint: number
  readonly story: Story | undefined
  readonly content: LoadedContent
  readonly recall: UseRecallResult
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
  const terms = new Map(content.game.concepts?.concepts.map((concept) => [concept.id, concept.term]))
  const { deck } = input.recall
  const count = `${deck.cards.length} card${deck.cards.length === 1 ? '' : 's'}`
  return {
    learned: (level.teaches ?? []).flatMap((id) => terms.get(id) ?? []),
    recall:
      deck.cards.length > 0
        ? {
            title: deck.region ? `${deck.region.name}: the region in ${count}` : 'Before you go on',
            note: `${deck.region ? `${count} from this region's ${deck.region.levels} levels` : `${count} from earlier levels`}. ${RECALL_HOW}`,
            cards: deck.cards.map(({ card, levelId }) => ({
              id: card.id,
              term: card.term,
              answer: card.simple ?? card.summary,
              seenIn: labelOf(content, levelId)?.heading ?? label.heading,
            })),
            onMark: (cardId, knew) => void input.recall.mark(cardId, knew),
          }
        : null,
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
