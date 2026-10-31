import { EditorContainer } from '@features/editor'
import { PlacementContainer } from '@features/placement'
import { TerminalContainer } from '@features/terminal'

export interface PlacementPageProps {
  act: string
  regionId: string
}

/** A region's placement check, with the Machine's editor and terminal for its tasks. */
export function PlacementPage({ act, regionId }: PlacementPageProps) {
  return (
    <PlacementContainer
      act={act}
      regionId={regionId}
      terminal={<TerminalContainer />}
      editor={(levelId) => <EditorContainer key={levelId} levelId={levelId} />}
    />
  )
}
