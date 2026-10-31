import type { StringRule, Validated } from '@kernelfall/core/types'
import { Issues, ObjectReader, reportDuplicates } from '@kernelfall/core/utils'
import { SYSCALL_NAME_PATTERN } from '#types/definitions/checks'
import type { FieldGuide, FieldGuideEntry } from '#types/definitions/field-guide'
import { FIELD_GUIDE_KINDS } from '#types/definitions/field-guide'

const GUIDE_FIELDS = ['opensAt', 'entries'] as const
const ENTRY_FIELDS = ['name', 'kind', 'what', 'syscalls', 'syscallNote', 'firstMet', 'deepenedIn'] as const

const SYSCALL_NAME: StringRule = { pattern: SYSCALL_NAME_PATTERN, expected: 'a syscall name like openat' }

function readEntry(value: unknown, path: string, issues: Issues): FieldGuideEntry {
  const entry = new ObjectReader(value, path, issues)
  entry.rejectUnknownKeys(ENTRY_FIELDS)
  return {
    name: entry.string('name'),
    kind: entry.oneOf('kind', FIELD_GUIDE_KINDS),
    what: entry.string('what'),
    syscalls: entry.has('syscalls') ? entry.stringList('syscalls', SYSCALL_NAME) : [],
    ...(entry.has('syscallNote') ? { syscallNote: entry.string('syscallNote') } : {}),
    firstMet: entry.string('firstMet'),
    deepenedIn: entry.has('deepenedIn') ? entry.stringList('deepenedIn') : [],
  }
}

/**
 * Checks a parsed `field-guide.yaml`. Its slot numbers (`opensAt`, `firstMet`,
 * `deepenedIn`) are checked against the outline when the content is put together.
 */
export function validateFieldGuide(input: unknown): Validated<FieldGuide> {
  const issues = new Issues()
  const guide = new ObjectReader(input, '', issues)
  guide.rejectUnknownKeys(GUIDE_FIELDS)
  const entries = guide.list('entries', (value, path) => readEntry(value, path, issues))
  reportDuplicates(
    entries.map((entry) => entry.name),
    'entries',
    issues
  )
  return issues.result({ opensAt: guide.string('opensAt'), entries })
}
