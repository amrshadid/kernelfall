import type { StringRule, Validated } from '@kernelfall/core/types'
import { Issues, ObjectReader, reportDuplicates } from '@kernelfall/core/utils'
import { LEVEL_NUMBER_AND_SLUG_PATTERN, SLUG_PATTERN } from '#types/definitions/level'
import type { PlacementFile, PlacementTaskFile } from '#types/definitions/placement'

const PLACEMENT_FIELDS = ['offer', 'minutes', 'tasks'] as const
const TASK_FIELDS = ['level', 'task', 'files', 'objectives'] as const

const LEVEL_FOLDER: StringRule = {
  pattern: LEVEL_NUMBER_AND_SLUG_PATTERN,
  expected: 'a level folder like 05-kernel-up-close',
}
const SLUG: StringRule = { pattern: SLUG_PATTERN, expected: 'an objective id like exits-zero' }

function readTask(value: unknown, path: string, issues: Issues): PlacementTaskFile {
  const task = new ObjectReader(value, path, issues)
  task.rejectUnknownKeys(TASK_FIELDS)
  const objectives = task.stringList('objectives', SLUG)
  if (objectives.length === 0) {
    issues.add(task.pathOf('objectives'), 'expected at least one objective')
  }
  reportDuplicates(objectives, task.pathOf('objectives'), issues)
  return {
    level: task.string('level', LEVEL_FOLDER),
    task: task.string('task'),
    files: task.has('files') ? task.stringList('files') : [],
    objectives,
  }
}

/**
 * Checks a parsed `placement.yaml`. Its levels, their objectives and their
 * starter files are checked against the region when the content is put together.
 */
export function validatePlacement(input: unknown): Validated<PlacementFile> {
  const issues = new Issues()
  const placement = new ObjectReader(input, '', issues)
  placement.rejectUnknownKeys(PLACEMENT_FIELDS)
  const tasks = placement.list('tasks', (value, path) => readTask(value, path, issues))
  if (tasks.length === 0) {
    issues.add('tasks', 'expected at least one task')
  }
  reportDuplicates(
    tasks.map((task) => task.level),
    'tasks',
    issues
  )
  return issues.result({ offer: placement.string('offer'), minutes: placement.integer('minutes', 1), tasks })
}
