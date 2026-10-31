import type { ActFile, GameContent, LevelChecker, LevelId, MapLayerText, Validated } from '@kernelfall/game/types'
import {
  createGameContent,
  validateAct,
  validateFieldGuide,
  validateMapLayer,
  validateSkills,
} from '@kernelfall/game/utils'
import type { ContentFiles, LevelFolder, LevelPlace, LoadedContent, Story } from '#types/index'
import { ACT_FILE, BEDROCK_FILE, FIELD_GUIDE_FILE, SKILLS_FILE } from '#types/index'
import { folderOf } from '#utils/loader/content-paths.util'
import { childFolders, readLevels } from '#utils/loader/read-levels.util'
import { checkLayers, readOutline } from '#utils/loader/read-outline.util'
import { readYaml } from '#utils/loader/read-yaml.util'

function readActs(files: ContentFiles, errors: string[]): ReadonlyMap<string, ActFile> {
  const acts = new Map<string, ActFile>()
  for (const actFolder of childFolders(Object.keys(files.acts), null, errors)) {
    const path = `${actFolder}/${ACT_FILE}`
    const act = readYaml(files.acts[path] ?? '', path, validateAct, errors)
    if (act) {
      acts.set(actFolder, act)
    }
  }
  return acts
}

function checkersOf(files: ContentFiles, folders: ReadonlyMap<LevelId, string>): Record<LevelId, LevelChecker> {
  const byFolder = new Map([...folders].map(([levelId, folder]) => [folder, levelId]))
  const checkers: Record<LevelId, LevelChecker> = {}
  for (const [path, checker] of Object.entries(files.checkers)) {
    // A checker.ts outside any placed level is named by its folder, so createGameContent reports it.
    checkers[byFolder.get(folderOf(path)) ?? folderOf(path)] = checker
  }
  return checkers
}

function bundle(
  game: GameContent,
  layers: readonly MapLayerText[],
  levels: ReadonlyMap<string, LevelFolder>,
  folders: ReadonlyMap<LevelId, string>
): LoadedContent {
  const places = new Map<LevelId, LevelPlace>()
  for (const act of game.acts) {
    for (const region of act.regions) {
      for (const slot of region.slots) {
        if (slot.levelId !== null) {
          places.set(slot.levelId, { act, region, slot })
        }
      }
    }
  }
  const stories = new Map<LevelId, Story>()
  const starters = new Map<LevelId, Readonly<Record<string, string>>>()
  for (const { level, story, starter } of levels.values()) {
    stories.set(level.id, story)
    if (Object.keys(starter).length > 0) {
      starters.set(level.id, starter)
    }
  }
  const ids = game.levels.map((level) => level.id)
  return {
    game,
    acts: game.acts,
    layers,
    stories,
    starters,
    placeOf: (id) => places.get(id),
    folderOf: (id) => folders.get(id),
    nextLevel: (id) => (ids.includes(id) ? (ids[ids.indexOf(id) + 1] ?? null) : null),
  }
}

/** Reports every problem at once, with file and field, so a broken level shows a list, not a crash. */
export function loadContent(files: ContentFiles): Validated<LoadedContent> {
  const errors: string[] = []
  const skills = readYaml(files.skills, SKILLS_FILE, validateSkills, errors)
  const bedrock = readYaml(files.bedrock, BEDROCK_FILE, validateMapLayer, errors)
  const fieldGuide = readYaml(files.fieldGuide, FIELD_GUIDE_FILE, validateFieldGuide, errors)
  const acts = readActs(files, errors)
  const levels = readLevels(files, acts, errors)
  const outline = readOutline(files, acts, levels, errors)
  const layers = bedrock ? [...outline.layers, bedrock] : outline.layers
  checkLayers(outline.acts, layers, errors)
  if (!skills || !fieldGuide || errors.length > 0) {
    return { ok: false, errors }
  }
  const game = createGameContent({
    acts: outline.acts,
    levels: [...levels.values()].map((folder) => folder.level),
    skills,
    checkers: checkersOf(files, outline.folders),
    fieldGuide,
  })
  if (!game.ok) {
    return { ok: false, errors: game.errors }
  }
  return { ok: true, value: bundle(game.value, layers, levels, outline.folders) }
}
