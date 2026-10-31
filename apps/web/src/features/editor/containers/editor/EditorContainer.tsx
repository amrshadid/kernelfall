import { useContent } from '@features/content/hooks/content'
import { CodeEditorPresentation } from '@features/editor/components/editor'
import { type EditorWorkspaceOptions, useEditorWorkspace } from '@features/editor/hooks/workspace'
import type { FileContents } from '@features/editor/types'
import { refreshUntouchedDrafts, SCRATCH_STARTER } from '@features/editor/utils/drafts'
import { useCodeReplaced, useLevelCode, useLevelStatus } from '@kernelfall/game/hooks'
import type { LevelId } from '@kernelfall/game/types'
import { useState } from 'react'

export type EditorContainerProps = Partial<EditorWorkspaceOptions> & {
  /** The level being played: its starter code, and where the player's drafts are kept. */
  readonly levelId?: LevelId
}

// SIMPLIFIED: a level without starter code opens a scratch file.
export function EditorContainer({ levelId, starter, ...options }: EditorContainerProps) {
  const content = useContent()
  const { setCode, restorePlayerCode } = useLevelCode()
  const { record } = useLevelStatus(levelId ?? '')
  const levelStarter = (levelId ? content.starters.get(levelId) : undefined) ?? starter ?? SCRATCH_STARTER
  // Drafts are read once: later saves come from this editor.
  const [drafts] = useState(() =>
    record && Object.keys(record.code).length > 0 ? refreshUntouchedDrafts(record.code, levelStarter) : undefined
  )
  const [replacement, setReplacement] = useState<{ id: number; files: FileContents } | null>(null)

  useCodeReplaced((replaced) => {
    if (replaced.levelId === levelId) {
      setReplacement((last) => ({ id: (last?.id ?? 0) + 1, files: replaced.files }))
    }
  })

  return (
    <CodeEditorPresentation
      {...useEditorWorkspace({
        ...options,
        starter: levelStarter,
        drafts: options.drafts ?? drafts,
        onDraftsChange: options.onDraftsChange ?? (levelId ? (files) => void setCode(files) : undefined),
        replacement: options.replacement ?? replacement,
        onRestoreMine: options.onRestoreMine ?? (record?.playerCode ? () => void restorePlayerCode() : null),
      })}
    />
  )
}
