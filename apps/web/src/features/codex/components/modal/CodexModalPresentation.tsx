import { CodexCard } from '@shared/components/codex'
import { Dialog } from '@shared/components/modals'
import type { CodexCardData } from '@shared/types'

export interface CodexModalCard {
  readonly card: CodexCardData
  readonly simplified: readonly string[]
  readonly seenIn: string
}

export interface CodexModalPresentationProps {
  /** Null keeps the dialog closed. */
  open: CodexModalCard | null
  onClose: () => void
}

/** Over the level, so reading a card never leaves the mission. */
export function CodexModalPresentation({ open, onClose }: CodexModalPresentationProps) {
  return (
    <Dialog open={open !== null} onClose={onClose} title={open ? `Codex: ${open.card.term}` : 'Codex'} size="lg">
      {open && <CodexCard card={open.card} simplified={open.simplified} seenIn={open.seenIn} />}
    </Dialog>
  )
}
