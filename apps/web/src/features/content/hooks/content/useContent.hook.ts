import type { LoadedContent } from '@kernelfall/levels/types'
import { appContent } from '@kernelfall/levels/utils'

/** Screens always get valid content: the router shows the errors instead of any screen. */
export function useContent(): LoadedContent {
  const content = appContent()
  if (!content.ok) {
    throw new Error('useContent() ran with invalid level content; the router should have shown the errors')
  }
  return content.value
}
