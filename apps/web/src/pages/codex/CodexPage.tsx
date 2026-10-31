import { CodexContainer } from '@features/codex'

export interface CodexPageProps {
  cardId: string | null
}

export function CodexPage({ cardId }: CodexPageProps) {
  return <CodexContainer cardId={cardId} />
}
