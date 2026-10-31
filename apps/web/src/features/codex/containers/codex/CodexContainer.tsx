import { useScreenChrome } from '@features/chrome/hooks/screen'
import { CodexPresentation } from '@features/codex/components/codex'
import { useCodexTab } from '@features/codex/hooks/tabs'
import { codexCount, codexGroups, selectedCard } from '@features/codex/utils/chapters'
import { fieldGuideSections } from '@features/codex/utils/field-guide'
import { useContent } from '@features/content/hooks/content'
import { useCodexChapters, useFieldGuide } from '@kernelfall/game/hooks'
import { labelOf } from '@kernelfall/levels/utils'
import { hrefOf } from '@shared/navigation'
import { useMemo } from 'react'

export interface CodexContainerProps {
  cardId: string | null
}

export function CodexContainer({ cardId }: CodexContainerProps) {
  const chrome = useScreenChrome()
  const content = useContent()
  const chapters = useCodexChapters()
  const guide = useFieldGuide()
  const { tab, setTab } = useCodexTab(cardId, guide.open)

  const { filed, total } = codexCount(chapters)
  const selected = selectedCard(chapters, cardId)
  const level = selected ? content.game.level(selected.levelId) : undefined
  const fieldGuide = useMemo(() => {
    if (!guide.open) return null
    // Only cards already found are linked: the guide never spoils one.
    const cards = chapters.flatMap((chapter) => chapter.cards.filter((entry) => entry.state !== 'hidden'))
    const slots = content.game.acts.flatMap((act) => act.regions.flatMap((region) => region.slots))
    return fieldGuideSections(
      guide.entries,
      cards.map((entry) => entry.card),
      slots
    )
  }, [guide, chapters, content])

  return (
    <CodexPresentation
      chrome={chrome}
      backHref={hrefOf({ name: 'title' })}
      filed={filed}
      total={total}
      groups={codexGroups(chapters)}
      selectedId={selected?.card.id ?? null}
      selection={
        selected && level
          ? {
              card: selected.card,
              simplified: level.fidelity.simplified,
              seenIn: labelOf(content, level.id)?.heading ?? level.title,
              filed: selected.state === 'filed',
            }
          : null
      }
      fieldGuide={fieldGuide}
      tab={tab}
      onTab={setTab}
    />
  )
}
