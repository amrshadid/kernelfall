import { CodexModalPresentation } from '@features/codex/components/modal'
import { useCodexModal } from '@features/codex/hooks/modal'
import { useContent } from '@features/content/hooks/content'
import { labelOf } from '@kernelfall/levels/utils'

export interface CodexModalContainerProps {
  levelId: string
  /** The card named in the address; one the level doesn't have opens nothing. */
  cardId: string | null
}

export function CodexModalContainer({ levelId, cardId }: CodexModalContainerProps) {
  const content = useContent()
  const { close } = useCodexModal(levelId, cardId)
  const level = content.game.level(levelId)
  const card = cardId === null ? undefined : level?.codex.find((candidate) => candidate.id === cardId)
  const open =
    level && card
      ? { card, simplified: level.fidelity.simplified, seenIn: labelOf(content, levelId)?.heading ?? level.title }
      : null
  return <CodexModalPresentation open={open} onClose={close} />
}
