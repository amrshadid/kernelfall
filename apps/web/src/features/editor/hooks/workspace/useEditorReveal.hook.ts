import type { FileContents, RevealRequest } from '@features/editor/types'
import { withoutDotSlash } from '@features/editor/utils/workspace'
import { useRevealRequests } from '@kernelfall/machine/hooks'
import { useRef, useState } from 'react'

/** A clicked `file:line` in the terminal opens that file and moves the cursor there; other files are ignored. */
export function useEditorReveal(contents: FileContents, open: (path: string) => void): RevealRequest | null {
  const [reveal, setReveal] = useState<RevealRequest | null>(null)
  const latest = useRef(contents)
  latest.current = contents

  useRevealRequests((location) => {
    const path = withoutDotSlash(location.file)
    if (!(path in latest.current)) {
      return
    }
    open(path)
    setReveal((last) => ({ id: (last?.id ?? 0) + 1, path, line: location.line, column: location.column }))
  })

  return reveal
}
