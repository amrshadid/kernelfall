import type { LevelChecker } from '@kernelfall/game/types'
import type { ContentFiles } from '#types/index'

const CONTENT_DIR = '/content/'

// Vite inlines every content file at build time, so the game needs no server and
// works offline. Globs are written relative to this file: import.meta.glob takes
// paths, not the package's `#` imports. solution/ is never globbed here, so the
// reference stays out of the bundle (see utils/solutions). Vite needs each glob's
// options written out as a literal.
const actFiles = import.meta.glob<string>('../../../content/*/act.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const regionFiles = import.meta.glob<string>('../../../content/*/*/region.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const placementFiles = import.meta.glob<string>('../../../content/*/*/placement.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const levelFiles = import.meta.glob<string>('../../../content/*/*/*/level.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const storyFiles = import.meta.glob<string>('../../../content/*/*/*/story.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const starterFiles = import.meta.glob<string>('../../../content/*/*/*/starter/*', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const checkerFiles = import.meta.glob<LevelChecker>('../../../content/*/*/*/checker.ts', {
  import: 'checker',
  eager: true,
})
const skillsFile = import.meta.glob<string>('../../../content/skills.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const bedrockFile = import.meta.glob<string>('../../../content/bedrock.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const fieldGuideFile = import.meta.glob<string>('../../../content/field-guide.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** `…/content/0-prologue/act.yaml` → `0-prologue/act.yaml`, whatever form the bundler gives the path. */
export function relativeToContent<T>(files: Readonly<Record<string, T>>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(files).map(([path, value]) => {
      const at = path.indexOf(CONTENT_DIR)
      return [at === -1 ? path : path.slice(at + CONTENT_DIR.length), value]
    })
  )
}

/** The text of the one file a glob matched; empty if it's missing, so the loader reports it. */
const single = (files: Readonly<Record<string, string>>): string => Object.values(files)[0] ?? ''

/** Every content file in the repository, keyed by its path in content/. */
export const CONTENT_FILES: ContentFiles = {
  acts: relativeToContent(actFiles),
  regions: relativeToContent(regionFiles),
  placements: relativeToContent(placementFiles),
  levels: relativeToContent(levelFiles),
  stories: relativeToContent(storyFiles),
  starters: relativeToContent(starterFiles),
  checkers: relativeToContent(checkerFiles),
  skills: single(skillsFile),
  bedrock: single(bedrockFile),
  fieldGuide: single(fieldGuideFile),
}
