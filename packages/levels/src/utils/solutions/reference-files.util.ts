import type { LevelId } from '@kernelfall/game/types'
import type { FileLoader } from '#types/index'
import { appContent } from '#utils/loader/app-content.util'
import { relativeToContent } from '#utils/loader/content-files.util'
import { filesIn } from '#utils/loader/content-paths.util'

const SOLUTION_DIR = 'solution'

// init's versions load only when the player asks for one: each file is its own
// lazy chunk, so the reference stays out of the game's bundle until then. The
// glob is relative to this file, like the loader's.
const solutionFiles: Readonly<Record<string, FileLoader>> = relativeToContent(
  import.meta.glob<string>('../../../content/*/*/*/solution/*', { query: '?raw', import: 'default' })
)

/** The loaders of a level folder's `solution/` files, by file name. */
export function referenceLoadersFor(
  folder: string,
  files: Readonly<Record<string, FileLoader>> = solutionFiles
): Readonly<Record<string, FileLoader>> {
  return filesIn(files, folder, SOLUTION_DIR)
}

/** init's version of a level, by file name, or null for a level without one. */
export async function loadReferenceFiles(levelId: LevelId): Promise<Record<string, string> | null> {
  const content = appContent()
  const folder = content.ok ? content.value.folderOf(levelId) : undefined
  const entries = folder === undefined ? [] : Object.entries(referenceLoadersFor(folder))
  if (entries.length === 0) {
    return null
  }
  const texts = await Promise.all(entries.map(([, load]) => load()))
  return Object.fromEntries(entries.map(([name], index) => [name, texts[index] ?? '']))
}
