import type {
  ActFile,
  ActOutline,
  LevelId,
  MapLayerText,
  PlacementCheck,
  PlacementTask,
  RegionOutline,
  SlotOutline,
} from '@kernelfall/game/types'
import { validatePlacement, validateRegion } from '@kernelfall/game/utils'
import type { ContentFiles, LevelFolder, Outline } from '#types/index'
import { ACT_FILE, LEVEL_FILE, PLACEMENT_FILE, REGION_FILE } from '#types/index'
import { folderOf, leafOf, orderOf } from '#utils/loader/content-paths.util'
import { childFolders } from '#utils/loader/read-levels.util'
import { readYaml } from '#utils/loader/read-yaml.util'

interface Found {
  readonly layers: MapLayerText[]
  readonly folders: Map<LevelId, string>
}

/** One region.yaml: its slots name level folders, which give the levels their ids. */
function readRegion(
  regionFolder: string,
  act: ActFile,
  files: ContentFiles,
  levels: ReadonlyMap<string, LevelFolder>,
  found: Found,
  errors: string[]
): RegionOutline | null {
  const path = `${regionFolder}/${REGION_FILE}`
  const region = readYaml(files.regions[path] ?? '', path, validateRegion, errors)
  if (!region) {
    return null
  }
  if (orderOf(regionFolder)?.name !== region.id) {
    errors.push(`${path}: id "${region.id}" must match its folder "${leafOf(regionFolder)}" after the number`)
  }
  if (region.layer) {
    found.layers.push(region.layer)
  }
  const slots = region.slots.map((slot): SlotOutline => {
    const planned = {
      ...(slot.summary === undefined ? {} : { summary: slot.summary }),
      ...(slot.minutes === undefined ? {} : { minutes: slot.minutes }),
    }
    if (slot.level === undefined) {
      return { number: slot.number, title: slot.title, levelId: null, optional: slot.optional, ...planned }
    }
    // Level ids are `<act>-<region>-<level folder>`, so saves keep pointing at the same level.
    const levelId = `${act.id}-${region.id}-${slot.level}`
    const folder = `${regionFolder}/${slot.level}`
    const level = levels.get(folder)?.level
    if (!level) {
      errors.push(`${path}: slot ${slot.number} names the folder ${slot.level}, which has no ${LEVEL_FILE}`)
    } else if (level.id !== levelId) {
      errors.push(`${folder}/${LEVEL_FILE}: id "${level.id}" must be "${levelId}" (act, region and folder)`)
    }
    found.folders.set(levelId, folder)
    // The built level describes itself; the slot's fields stay as a fallback.
    const own = {
      ...(level?.summary === undefined ? {} : { summary: level.summary }),
      ...(level?.minutes === undefined ? {} : { minutes: level.minutes }),
    }
    return { number: slot.number, title: slot.title, levelId, optional: slot.optional, ...planned, ...own }
  })
  const placement = readPlacement(regionFolder, act, region.id, files, levels, errors)
  return {
    id: region.id,
    name: region.name,
    boss: region.boss,
    caption: region.caption,
    source: region.source,
    guide: region.guide,
    layer: region.layer?.key ?? region.inLayer ?? act.layer.key,
    slots,
    ...(placement ? { placement } : {}),
  }
}

/**
 * The region's `placement.yaml`, if it has one, with each task's level folder
 * turned into its id. A task opens only files of its level's starter.
 */
function readPlacement(
  regionFolder: string,
  act: ActFile,
  regionId: string,
  files: ContentFiles,
  levels: ReadonlyMap<string, LevelFolder>,
  errors: string[]
): PlacementCheck | null {
  const path = `${regionFolder}/${PLACEMENT_FILE}`
  const text = files.placements[path]
  const placement = text === undefined ? null : readYaml(text, path, validatePlacement, errors)
  if (!placement) {
    return null
  }
  const tasks = placement.tasks.map(({ level, ...task }): PlacementTask => {
    const starter = levels.get(`${regionFolder}/${level}`)?.starter ?? {}
    for (const file of task.files.filter((name) => starter[name] === undefined)) {
      errors.push(`${path}: the task for ${level} opens ${file}, which its starter doesn't have`)
    }
    return { ...task, levelId: `${act.id}-${regionId}-${level}` }
  })
  return { ...placement, tasks }
}

/** The acts, their regions and slots in play order; every level folder must be named by a slot. */
export function readOutline(
  files: ContentFiles,
  actFiles: ReadonlyMap<string, ActFile>,
  levels: ReadonlyMap<string, LevelFolder>,
  errors: string[]
): Outline {
  const found: Found = { layers: [], folders: new Map() }
  const regionPaths = Object.keys(files.regions)
  const actFolders = Object.keys(files.acts).map(folderOf)
  for (const path of regionPaths.filter((candidate) => !actFolders.includes(folderOf(folderOf(candidate))))) {
    errors.push(`${path}: its act folder has no ${ACT_FILE}`)
  }
  const acts = [...actFiles].map(([actFolder, act]): ActOutline => {
    found.layers.push(act.layer)
    const regions = childFolders(regionPaths, actFolder, errors).flatMap((regionFolder) => {
      const region = readRegion(regionFolder, act, files, levels, found, errors)
      return region ? [region] : []
    })
    return { act: act.id, name: act.name, layer: act.layer, regions }
  })
  const placed = new Set(found.folders.values())
  for (const folder of [...levels.keys()].filter((candidate) => !placed.has(candidate))) {
    errors.push(`${folder}: no slot of its ${REGION_FILE} names this level`)
  }
  return { acts, layers: found.layers, folders: found.folders }
}

/** Every layer key once, and every region drawn in a layer that exists. */
export function checkLayers(acts: readonly ActOutline[], layers: readonly MapLayerText[], errors: string[]): void {
  const keys = layers.map((layer) => layer.key)
  for (const key of keys.filter((key, index) => keys.indexOf(key) !== index)) {
    errors.push(`map layer "${key}" is defined more than once`)
  }
  for (const act of acts) {
    for (const region of act.regions.filter((candidate) => !keys.includes(candidate.layer))) {
      errors.push(`${act.act}/${region.id}: drawn in the layer "${region.layer}", which no act or region defines`)
    }
  }
}
