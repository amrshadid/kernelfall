import type {
  ActOutline,
  GameContent,
  LevelChecker,
  LevelDefinition,
  LevelId,
  MapLayerText,
  RegionOutline,
  SlotOutline,
} from '@kernelfall/game/types'

/** The file names that make a folder of content/ an act, a region or a level. */
export const ACT_FILE = 'act.yaml'
export const REGION_FILE = 'region.yaml'
export const PLACEMENT_FILE = 'placement.yaml'
export const LEVEL_FILE = 'level.yaml'
export const STORY_FILE = 'story.md'
export const STARTER_DIR = 'starter'
export const SKILLS_FILE = 'skills.yaml'
export const BEDROCK_FILE = 'bedrock.yaml'
export const FIELD_GUIDE_FILE = 'field-guide.yaml'

/** One block of a story section: a spoken (or narrated) line, or a code sample. */
export type StoryBlock =
  | { readonly kind: 'line'; readonly speaker: string | null; readonly text: string }
  | { readonly kind: 'code'; readonly text: string }

/** A level's `story.md`, by section slug (`scene`, `see-it`, `debrief`, `real-world`…). */
export type Story = ReadonlyMap<string, readonly StoryBlock[]>

/** Where a built level sits in the outline. */
export interface LevelPlace {
  readonly act: ActOutline
  readonly region: RegionOutline
  readonly slot: SlotOutline
}

/** Everything the screens read about the content, checked once at startup. */
export interface LoadedContent {
  readonly game: GameContent
  /** The acts in play order; the same outline as `game.acts`. */
  readonly acts: readonly ActOutline[]
  /** The Kernel Map's layers, top to bottom: each act's, each region's own, then Bedrock. */
  readonly layers: readonly MapLayerText[]
  readonly stories: ReadonlyMap<LevelId, Story>
  /** The player's code at the start of each level that ships some: file name → text. */
  readonly starters: ReadonlyMap<LevelId, Readonly<Record<string, string>>>
  placeOf(levelId: LevelId): LevelPlace | undefined
  /** The level's folder in content/, e.g. `0-prologue/1-boot-path/02-first-words`. */
  folderOf(levelId: LevelId): string | undefined
  /** The next built level in play order, if any. */
  nextLevel(levelId: LevelId): LevelId | null
}

/** The content files, each keyed by its path in content/ (`0-prologue/act.yaml`). */
export interface ContentFiles {
  /** `<act>/act.yaml` → text. */
  readonly acts: Readonly<Record<string, string>>
  /** `<act>/<region>/region.yaml` → text. */
  readonly regions: Readonly<Record<string, string>>
  /** `<act>/<region>/placement.yaml` → text, for the regions a placement check lets players skip. */
  readonly placements: Readonly<Record<string, string>>
  /** `<act>/<region>/<level>/level.yaml` → text. */
  readonly levels: Readonly<Record<string, string>>
  /** `<act>/<region>/<level>/story.md` → text. */
  readonly stories: Readonly<Record<string, string>>
  /** `<act>/<region>/<level>/starter/<file>` → text. */
  readonly starters: Readonly<Record<string, string>>
  /** `<act>/<region>/<level>/checker.ts` → the checker it exports. */
  readonly checkers: Readonly<Record<string, LevelChecker>>
  /** `skills.yaml`. */
  readonly skills: string
  /** `bedrock.yaml`: the map layer under every act. */
  readonly bedrock: string
  /** `field-guide.yaml`: the Codex page of commands and folders. */
  readonly fieldGuide: string
}

/** A level folder that read cleanly: its level.yaml, story and starter code. */
export interface LevelFolder {
  readonly folder: string
  readonly level: LevelDefinition
  readonly story: Story
  readonly starter: Readonly<Record<string, string>>
}

/** The acts as the region.yaml files lay them out, and the map layers they define. */
export interface Outline {
  readonly acts: readonly ActOutline[]
  readonly layers: readonly MapLayerText[]
  /** The level folders the slots point at, by the level id they give them. */
  readonly folders: ReadonlyMap<LevelId, string>
}

/** How a level is named on screen: its number, title and where it sits in the outline. */
export interface LevelLabel {
  readonly levelId: LevelId
  /** `P.2`, `1.4`. */
  readonly number: string
  readonly title: string
  /** "1.4 Run Anything"; a Prologue level reads by its title alone, "First Words". */
  readonly heading: string
  readonly regionName: string
  readonly actName: string
}

/** Loads one file lazily, as its own chunk. */
export type FileLoader = () => Promise<string>
