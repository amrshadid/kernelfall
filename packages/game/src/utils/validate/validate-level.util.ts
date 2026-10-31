import type { StringRule, Validated } from '@kernelfall/core/types'
import { Issues, ObjectReader, reportDuplicates } from '@kernelfall/core/utils'
import type { LabSetup } from '@kernelfall/machine/types'
import { validateLabSetup } from '@kernelfall/machine/utils'
import { HINT_TIERS } from '#types/definitions/hints'
import type {
  CodexCard,
  CommandChip,
  LevelDefinition,
  LevelHints,
  LevelLocation,
  Objective,
  StoryRefs,
  TaintRule,
} from '#types/definitions/level'
import {
  DOCS_URL_PATTERN,
  KERNEL_PATH_PATTERN,
  LEVEL_NUMBER_AND_SLUG_PATTERN,
  MAX_LEVEL_MINUTES,
  SLUG_PATTERN,
  STORY_REF_PATTERN,
  TRACKS,
  XRAY_VIEWS,
} from '#types/definitions/level'
import { TAINT_KINDS } from '#types/definitions/taint'
import { readObjectiveCheck, readTaintCheck } from '#utils/validate/validate-checks.util'

const LEVEL_FIELDS = [
  'id',
  'title',
  'summary',
  'minutes',
  'tracks',
  'skills',
  'prerequisites',
  'objectives',
  'hints',
  'chips',
  'xray',
  'codex',
  'taint',
  'fidelity',
  'story',
  'lab',
] as const

const SLUG: StringRule = { pattern: SLUG_PATTERN, expected: 'a kebab-case id like fork-exec' }
const STORY_REF: StringRule = {
  pattern: STORY_REF_PATTERN,
  expected: 'a story section like story.md#scene',
}
const KERNEL_PATH: StringRule = {
  pattern: KERNEL_PATH_PATTERN,
  expected: 'a kernel source path like kernel/fork.c',
}
const DOCS_URL: StringRule = { pattern: DOCS_URL_PATTERN, expected: 'an https:// link' }

/**
 * Checks a parsed `level.yaml` found in `location`'s folders and returns the
 * typed level, or every problem found with the path to the field, e.g.
 * `hints: expected exactly 3 hints …`.
 */
export function validateLevel(input: unknown, location: LevelLocation): Validated<LevelDefinition> {
  const issues = new Issues()
  const level = new ObjectReader(input, '', issues)
  level.rejectUnknownKeys(LEVEL_FIELDS)

  const definition: LevelDefinition = {
    id: level.string('id'),
    title: level.string('title'),
    ...(level.has('summary') ? { summary: level.string('summary') } : {}),
    ...(level.has('minutes') ? { minutes: level.integer('minutes', 1, MAX_LEVEL_MINUTES) } : {}),
    act: location.act,
    region: location.region,
    tracks: level.oneOfList('tracks', TRACKS),
    skills: level.stringList('skills', SLUG),
    prerequisites: level.stringList('prerequisites', SLUG),
    objectives: level.list('objectives', (value, path) => readObjective(value, path, issues)),
    hints: readHints(level),
    ...(level.has('chips') ? { chips: level.list('chips', (value, path) => readChip(value, path, issues)) } : {}),
    xray: level.oneOfList('xray', XRAY_VIEWS),
    codex: level.list('codex', (value, path) => readCodexCard(value, path, issues)),
    taint: level.list('taint', (value, path) => readTaintRule(value, path, issues)),
    fidelity: readFidelity(level.object('fidelity')),
    story: readStoryRefs(level.object('story')),
    ...(level.has('lab') ? { lab: readLabSetup(level) } : {}),
  }
  checkConsistency(definition, issues)
  return issues.result(definition)
}

/** The `lab:` block, checked by the lab's own schema; its errors already carry their `lab.` path. */
function readLabSetup(level: ObjectReader): LabSetup {
  const setup = validateLabSetup(level.value('lab'))
  if (!setup.ok) {
    for (const error of setup.errors) {
      level.issues.add('', error)
    }
    return {}
  }
  return setup.value
}

function readObjective(value: unknown, path: string, issues: Issues): Objective {
  const objective = new ObjectReader(value, path, issues)
  objective.rejectUnknownKeys(['id', 'text', 'check'])
  return {
    id: objective.string('id', SLUG),
    text: objective.string('text'),
    ...(objective.has('check') ? { check: readObjectiveCheck(objective.object('check')) } : {}),
  }
}

function readChip(value: unknown, path: string, issues: Issues): CommandChip {
  const chip = new ObjectReader(value, path, issues)
  chip.rejectUnknownKeys(['command', 'explain'])
  return { command: chip.string('command'), explain: chip.string('explain') }
}

function readHints(level: ObjectReader): LevelHints {
  const hints = level.stringList('hints')
  const [nudge, concept, spot] = hints
  if (hints.length !== HINT_TIERS.length || !nudge || !concept || !spot) {
    level.issues.add(
      level.pathOf('hints'),
      `expected exactly ${HINT_TIERS.length} hints (${HINT_TIERS.join(', ')}), got ${hints.length}`
    )
    return ['', '', '']
  }
  return [nudge, concept, spot]
}

function readCodexCard(value: unknown, path: string, issues: Issues): CodexCard {
  const card = new ObjectReader(value, path, issues)
  card.rejectUnknownKeys(['id', 'term', 'summary', 'simple', 'deep', 'deepens', 'sources', 'docs', 'tryIt'])
  const simple = card.has('simple') ? card.string('simple') : undefined
  const deep = card.has('deep') ? card.string('deep') : undefined
  const deepens = card.has('deepens') ? card.string('deepens', SLUG) : undefined
  const id = card.string('id', SLUG)
  if (deep !== undefined && simple === undefined) {
    issues.add(card.pathOf('deep'), 'a card with a deep text also needs its simple line')
  }
  if (deepens !== undefined && deepens === id) {
    issues.add(card.pathOf('deepens'), 'a card cannot deepen itself')
  }
  return {
    id,
    term: card.string('term'),
    // A card with a simple line may leave the summary out: lists show the simple line.
    summary: simple !== undefined && !card.has('summary') ? simple : card.string('summary'),
    ...(simple === undefined ? {} : { simple }),
    ...(deep === undefined ? {} : { deep }),
    ...(deepens === undefined ? {} : { deepens }),
    sources: card.stringList('sources', KERNEL_PATH),
    docs: card.string('docs', DOCS_URL),
    tryIt: card.string('tryIt'),
  }
}

function readTaintRule(value: unknown, path: string, issues: Issues): TaintRule {
  const rule = new ObjectReader(value, path, issues)
  rule.rejectUnknownKeys(['id', 'kind', 'points', 'description', 'check'])
  return {
    id: rule.string('id', SLUG),
    kind: rule.oneOf('kind', TAINT_KINDS),
    points: rule.integer('points', 1),
    description: rule.string('description'),
    ...(rule.has('check') ? { check: readTaintCheck(rule.object('check')) } : {}),
  }
}

function readFidelity(fidelity: ObjectReader): LevelDefinition['fidelity'] {
  fidelity.rejectUnknownKeys(['faithful', 'simplified'])
  return {
    faithful: fidelity.stringList('faithful'),
    simplified: fidelity.stringList('simplified'),
  }
}

function readStoryRefs(story: ObjectReader): StoryRefs {
  story.rejectUnknownKeys(['scene', 'debrief', 'realWorld'])
  return {
    scene: story.string('scene', STORY_REF),
    debrief: story.string('debrief', STORY_REF),
    realWorld: story.string('realWorld', STORY_REF),
  }
}

function checkConsistency(level: LevelDefinition, issues: Issues): void {
  checkId(level, issues)
  requireSome('tracks', level.tracks, issues)
  requireSome('skills', level.skills, issues)
  requireSome('objectives', level.objectives, issues)
  requireSome('codex', level.codex, issues)
  reportDuplicates(level.tracks, 'tracks', issues)
  reportDuplicates(level.skills, 'skills', issues)
  reportDuplicates(level.prerequisites, 'prerequisites', issues)
  reportDuplicates(level.xray, 'xray', issues)
  reportDuplicates(
    (level.chips ?? []).map((chip) => chip.command),
    'chips',
    issues
  )
  reportDuplicates(
    level.objectives.map((objective) => objective.id),
    'objectives',
    issues
  )
  reportDuplicates(
    level.codex.map((card) => card.id),
    'codex',
    issues
  )
  reportDuplicates(
    level.taint.map((rule) => rule.id),
    'taint',
    issues
  )
  for (const skill of level.prerequisites.filter((id) => level.skills.includes(id))) {
    issues.add('prerequisites', `"${skill}" is also a skill this level unlocks`)
  }
}

function checkId(level: LevelDefinition, issues: Issues): void {
  const prefix = `${level.act}-${level.region}-`
  const rest = level.id.slice(prefix.length)
  if (!level.id.startsWith(prefix) || !LEVEL_NUMBER_AND_SLUG_PATTERN.test(rest)) {
    issues.add('id', `expected "${prefix}<nn>-<slug>" (from its act and region), got "${level.id}"`)
  }
}

function requireSome(path: string, values: readonly unknown[], issues: Issues): void {
  if (values.length === 0) {
    issues.add(path, 'expected at least one entry')
  }
}
