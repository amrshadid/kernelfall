import type { CodexGroup } from '@features/codex/types'
import type { CodexChapter, CodexChapterCard } from '@kernelfall/game/types'
import { hrefOf } from '@shared/navigation'

/** Cards not found yet are only counted (no spoilers). */
export function codexGroups(chapters: readonly CodexChapter[]): readonly CodexGroup[] {
  return chapters.map((chapter) => ({
    key: `${chapter.act}/${chapter.region.id}`,
    name: chapter.region.name,
    entries: chapter.cards.flatMap((entry) =>
      entry.state === 'hidden'
        ? []
        : [
            {
              id: entry.card.id,
              term: entry.card.term,
              href: hrefOf({ name: 'codex', cardId: entry.card.id }),
              state: entry.state,
            },
          ]
    ),
    hidden: chapter.cards.filter((entry) => entry.state === 'hidden').length,
  }))
}

/** The addressed card if found, else the first one filed; a hidden card is never shown. */
export function selectedCard(chapters: readonly CodexChapter[], cardId: string | null): CodexChapterCard | undefined {
  const found = chapters.flatMap((chapter) => chapter.cards).filter((entry) => entry.state !== 'hidden')
  if (cardId === null) {
    return found.find((entry) => entry.state === 'filed')
  }
  return found.find((entry) => entry.card.id === cardId)
}

export function codexCount(chapters: readonly CodexChapter[]): { readonly filed: number; readonly total: number } {
  const cards = chapters.flatMap((chapter) => chapter.cards)
  return { filed: cards.filter((entry) => entry.state === 'filed').length, total: cards.length }
}
