import { CodexModalContainer } from '@features/codex'
import { EditorContainer } from '@features/editor'
import { LevelLayoutContainer } from '@features/level'
import { TerminalContainer } from '@features/terminal'
import { XrayContainer } from '@features/xray'

export interface LevelPageProps {
  levelId: string
  /** A Codex card open over the level, from the address. */
  cardId: string | null
}

/** The layout runs the level's Machine; the terminal, X-ray and editor go into it as slots. */
export function LevelPage({ levelId, cardId }: LevelPageProps) {
  return (
    <>
      <LevelLayoutContainer
        levelId={levelId}
        editor={<EditorContainer key={levelId} levelId={levelId} />}
        terminal={<TerminalContainer />}
        xray={<XrayContainer />}
      />
      <CodexModalContainer levelId={levelId} cardId={cardId} />
    </>
  )
}
