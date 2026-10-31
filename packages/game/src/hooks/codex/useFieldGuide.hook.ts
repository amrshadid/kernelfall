import { useMemo } from 'react'
import { getContent } from '#config'
import { useProgressStore } from '#store/progress.store'
import type { FieldGuideView } from '#types/definitions/field-guide'
import { fieldGuideView } from '#utils/field-guide/index'

/** The Codex's Field Guide page: whether it's open yet, and the commands and folders met so far. */
export function useFieldGuide(): FieldGuideView {
  const progress = useProgressStore((state) => state.progress)
  return useMemo(() => fieldGuideView(getContent(), progress), [progress])
}
