import type { StringRule, Validated } from '@kernelfall/core/types'
import { describeType, Issues, joinPath, ObjectReader } from '@kernelfall/core/utils'
import { ACTS, LEVEL_NUMBER_AND_SLUG_PATTERN, MAX_LEVEL_MINUTES, SLUG_PATTERN } from '#types/definitions/level'
import type { ActFile, MapLayerText, RegionFile, SlotFile } from '#types/definitions/outline'
import type { SkillNode } from '#types/definitions/skills'

const LAYER_FIELDS = ['key', 'name', 'short', 'kicker', 'caption', 'note', 'source', 'guides'] as const
const ACT_FIELDS = ['id', 'name', 'layer'] as const
const REGION_FIELDS = ['id', 'name', 'boss', 'caption', 'source', 'guide', 'layer', 'inLayer', 'slots'] as const
const SLOT_FIELDS = ['number', 'title', 'level', 'optional', 'summary', 'minutes'] as const
const SKILL_FIELDS = ['id', 'title', 'region', 'prerequisites'] as const

const SLUG: StringRule = { pattern: SLUG_PATTERN, expected: 'a kebab-case id like process-district' }
const LEVEL_FOLDER: StringRule = {
  pattern: LEVEL_NUMBER_AND_SLUG_PATTERN,
  expected: 'a level folder like 04-run-anything',
}

/** A layer of the Kernel Map, from an `act.yaml` or a `region.yaml`. */
function readLayer(layer: ObjectReader): MapLayerText {
  layer.rejectUnknownKeys(LAYER_FIELDS)
  return {
    key: layer.string('key', SLUG),
    name: layer.string('name'),
    short: layer.string('short'),
    kicker: layer.string('kicker'),
    caption: layer.string('caption'),
    note: layer.string('note'),
    source: layer.string('source'),
    guides: layer.string('guides'),
  }
}

/** Checks a parsed `act.yaml`: the act's id, name and map layer. */
export function validateAct(input: unknown): Validated<ActFile> {
  const issues = new Issues()
  const act = new ObjectReader(input, '', issues)
  act.rejectUnknownKeys(ACT_FIELDS)
  return issues.result({ id: act.oneOf('id', ACTS), name: act.string('name'), layer: readLayer(act.object('layer')) })
}

function readSlot(value: unknown, path: string, issues: Issues): SlotFile {
  const slot = new ObjectReader(value, path, issues)
  slot.rejectUnknownKeys(SLOT_FIELDS)
  // Unquoted, YAML reads 1.10 as the number 1.1: the number must stay as written.
  const unquoted = slot.value('number')
  if (typeof unquoted === 'number') {
    issues.add(slot.pathOf('number'), `expected text in quotes, like "1.10", got the number ${unquoted}`)
  }
  return {
    number: typeof unquoted === 'number' ? String(unquoted) : slot.string('number'),
    title: slot.string('title'),
    ...(slot.has('level') ? { level: slot.string('level', LEVEL_FOLDER) } : {}),
    optional: slot.flag('optional'),
    ...(slot.has('summary') ? { summary: slot.string('summary') } : {}),
    ...(slot.has('minutes') ? { minutes: slot.integer('minutes', 1, MAX_LEVEL_MINUTES) } : {}),
  }
}

/**
 * Checks a parsed `region.yaml`: its map text and its slots in play order. A
 * region is drawn in its act's layer, in another act's (`inLayer`), or in a
 * layer of its own (`layer`).
 */
export function validateRegion(input: unknown): Validated<RegionFile> {
  const issues = new Issues()
  const region = new ObjectReader(input, '', issues)
  region.rejectUnknownKeys(REGION_FIELDS)
  if (region.has('layer') && region.has('inLayer')) {
    issues.add('inLayer', 'a region with a layer of its own is drawn in it: give layer or inLayer, not both')
  }
  const slots = region.list('slots', (value, path) => readSlot(value, path, issues))
  if (slots.length === 0) {
    issues.add('slots', 'expected at least one slot')
  }
  return issues.result({
    id: region.string('id', SLUG),
    name: region.string('name'),
    boss: region.flag('boss'),
    caption: region.string('caption'),
    source: region.string('source'),
    guide: region.string('guide'),
    ...(region.has('layer') ? { layer: readLayer(region.object('layer')) } : {}),
    ...(region.has('inLayer') ? { inLayer: region.string('inLayer', SLUG) } : {}),
    slots,
  })
}

/** Checks a parsed map layer that belongs to no act (Bedrock, under every act). */
export function validateMapLayer(input: unknown): Validated<MapLayerText> {
  const issues = new Issues()
  const layer = readLayer(new ObjectReader(input, '', issues))
  return issues.result(layer)
}

function readSkill(value: unknown, path: string, issues: Issues): SkillNode {
  const skill = new ObjectReader(value, path, issues)
  skill.rejectUnknownKeys(SKILL_FIELDS)
  return {
    id: skill.string('id', SLUG),
    title: skill.string('title'),
    region: skill.string('region', SLUG),
    prerequisites: skill.has('prerequisites') ? skill.stringList('prerequisites', SLUG) : [],
  }
}

/** Checks a parsed `skills.yaml`, a list of nodes; `validateSkillTree()` then checks the graph. */
export function validateSkills(input: unknown): Validated<readonly SkillNode[]> {
  const issues = new Issues()
  if (!Array.isArray(input)) {
    issues.add('', `expected a list of skills, got ${describeType(input)}`)
    return issues.result([])
  }
  return issues.result(input.map((value: unknown, index) => readSkill(value, joinPath('', index), issues)))
}
