import type { LoadedContent } from '#types/index'
import { CONTENT_FILES } from '#utils/loader/content-files.util'
import { loadContent } from '#utils/loader/load-content.util'

/** The repository's content, loaded; throws with every problem if it doesn't validate. */
export function loadedContent(): LoadedContent {
  const loaded = loadContent(CONTENT_FILES)
  if (!loaded.ok) {
    throw new Error(loaded.errors.join('\n'))
  }
  return loaded.value
}
