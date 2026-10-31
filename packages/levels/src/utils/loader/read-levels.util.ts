import type { ActFile, LevelLocation } from '@kernelfall/game/types'
import { validateLevel } from '@kernelfall/game/utils'
import type { ContentFiles, LevelFolder } from '#types/index'
import { ACT_FILE, LEVEL_FILE, STARTER_DIR, STORY_FILE } from '#types/index'
import { byPlayOrder, filesIn, folderOf, leafOf, orderOf } from '#utils/loader/content-paths.util'
import { readYaml } from '#utils/loader/read-yaml.util'
import { parseStory, sectionOf } from '#utils/story/index'

/** `parent` null means the top level. Each folder name must start with its number. */
export function childFolders(paths: readonly string[], parent: string | null, errors: string[]): string[] {
  const folders = paths
    .map(folderOf)
    .filter((folder) => (parent === null ? !folder.includes('/') : folderOf(folder) === parent))
  for (const folder of folders.filter((candidate) => orderOf(candidate) === null)) {
    errors.push(`${folder}: a folder name starts with its place in play order, like 1-${leafOf(folder)}`)
  }
  return byPlayOrder(folders)
}

/** Null when the act can't be read; an act.yaml that fails its checks has reported that already. */
export function locationOf(
  levelFolder: string,
  files: ContentFiles,
  acts: ReadonlyMap<string, ActFile>,
  errors: string[]
): LevelLocation | null {
  const regionFolder = folderOf(levelFolder)
  const actFolder = folderOf(regionFolder)
  const act = acts.get(actFolder)
  if (!act) {
    if (files.acts[`${actFolder}/${ACT_FILE}`] === undefined) {
      errors.push(`${levelFolder}/${LEVEL_FILE}: its act folder has no ${ACT_FILE}`)
    }
    return null
  }
  // An unnumbered region folder is reported with its region.yaml; the level still reads.
  return { act: act.id, region: orderOf(regionFolder)?.name ?? leafOf(regionFolder) }
}

/** Every level folder that reads cleanly, by folder; the rest add their problems to `errors`. */
export function readLevels(
  files: ContentFiles,
  acts: ReadonlyMap<string, ActFile>,
  errors: string[]
): ReadonlyMap<string, LevelFolder> {
  const levels = new Map<string, LevelFolder>()
  for (const [path, text] of Object.entries(files.levels)) {
    const folder = folderOf(path)
    const location = locationOf(folder, files, acts, errors)
    if (!location) {
      continue
    }
    const level = readYaml(text, path, (input) => validateLevel(input, location), errors)
    const storyPath = `${folder}/${STORY_FILE}`
    const storyText = files.stories[storyPath]
    if (storyText === undefined) {
      errors.push(`${storyPath}: missing`)
    }
    if (!level || storyText === undefined) {
      continue
    }
    const story = parseStory(storyText)
    for (const ref of Object.values(level.story)) {
      if (!story.has(sectionOf(ref))) {
        errors.push(`${storyPath}: no section for "${ref}"`)
      }
    }
    levels.set(folder, { folder, level, story, starter: filesIn(files.starters, folder, STARTER_DIR) })
  }
  return levels
}
