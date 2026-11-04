import type { StringRule, Validated } from '@kernelfall/core/types'
import { Issues, ObjectReader, reportDuplicates } from '@kernelfall/core/utils'
import type { Concept, ConceptCatalogue } from '#types/definitions/concepts'
import { CONCEPT_PARTS } from '#types/definitions/concepts'
import { SLUG_PATTERN } from '#types/definitions/level'

const CATALOGUE_FIELDS = ['concepts'] as const
const CONCEPT_FIELDS = ['id', 'term', 'part', 'codex'] as const

const SLUG: StringRule = { pattern: SLUG_PATTERN, expected: 'a kebab-case id like file-descriptor' }

function readConcept(value: unknown, path: string, issues: Issues): Concept {
  const concept = new ObjectReader(value, path, issues)
  concept.rejectUnknownKeys(CONCEPT_FIELDS)
  return {
    id: concept.string('id', SLUG),
    term: concept.string('term'),
    part: concept.oneOf('part', CONCEPT_PARTS),
    ...(concept.has('codex') ? { codex: concept.string('codex', SLUG) } : {}),
  }
}

// Codex card ids are checked later, against the levels, when the content is put together.
export function validateConcepts(input: unknown): Validated<ConceptCatalogue> {
  const issues = new Issues()
  const catalogue = new ObjectReader(input, '', issues)
  catalogue.rejectUnknownKeys(CATALOGUE_FIELDS)
  const concepts = catalogue.list('concepts', (value, path) => readConcept(value, path, issues))
  reportDuplicates(
    concepts.map((concept) => concept.id),
    'concepts',
    issues
  )
  return issues.result({ concepts })
}
