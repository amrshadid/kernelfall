// Prints every built level against the content budgets and the chain of concepts (docs/LEVELS.md#concepts-and-budgets).
// Usage: pnpm content:report. Fails only when a level of ENFORCED_LEVELS breaks a budget.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { ConceptViolation, LevelChecker } from '@kernelfall/game/types'
import { CORE_CONCEPT_BUDGET } from '@kernelfall/game/types'
import { conceptChain } from '@kernelfall/game/utils'
import type { ContentFiles, LevelLint, LoadedContent } from '#types/index'
import { labelOf } from '#utils/label/level-label.util'
import { ENFORCED_LEVELS, lintLevel, STORY_WORD_BUDGET } from '#utils/lint/index'
import { loadContent } from '#utils/loader/load-content.util'

const contentDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'content')
const paint = (code: number) => (text: string) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text)
const red = paint(31)
const green = paint(32)
const dim = paint(2)

// The same files the bundler globs for the game, read from disk.
async function contentFiles(): Promise<ContentFiles> {
  const paths = readdirSync(contentDir, { recursive: true, encoding: 'utf8' }).map((path) => path.split('\\').join('/'))
  const text = (path: string) => readFileSync(join(contentDir, path), 'utf8')
  const matching = (pattern: RegExp) =>
    Object.fromEntries(paths.filter((path) => pattern.test(path)).map((path) => [path, text(path)]))
  const checkers: Record<string, LevelChecker> = {}
  for (const path of paths.filter((candidate) => /^([^/]+\/){3}checker\.ts$/.test(candidate))) {
    const module: { checker: LevelChecker } = await import(pathToFileURL(join(contentDir, path)).href)
    checkers[path] = module.checker
  }
  return {
    acts: matching(/^[^/]+\/act\.yaml$/),
    regions: matching(/^([^/]+\/){2}region\.yaml$/),
    placements: matching(/^([^/]+\/){2}placement\.yaml$/),
    levels: matching(/^([^/]+\/){3}level\.yaml$/),
    stories: matching(/^([^/]+\/){3}story\.md$/),
    starters: matching(/^([^/]+\/){3}starter\/[^/]+$/),
    checkers,
    skills: text('skills.yaml'),
    bedrock: text('bedrock.yaml'),
    fieldGuide: text('field-guide.yaml'),
    concepts: text('concepts.yaml'),
  }
}

const over = (value: number, budget: number) => (value > budget ? red : green)(`${value}/${budget}`)

function printLevel(content: LoadedContent, lint: LevelLint): void {
  const level = content.game.level(lint.levelId)
  const label = labelOf(content, lint.levelId)
  const enforced = ENFORCED_LEVELS.includes(lint.levelId)
  const status = lint.problems.length === 0 ? green('green') : (enforced ? red : paint(33))(enforced ? 'red' : 'warn')
  console.log(`\n${label?.number ?? lint.levelId} ${level?.title ?? ''}  ${status}${enforced ? ' (enforced)' : ''}`)
  console.log(`  teaches ${over(lint.concepts, CORE_CONCEPT_BUDGET)}: ${(level?.teaches ?? []).join(', ') || '-'}`)
  console.log(`  uses: ${(level?.uses ?? []).join(', ') || '-'}`)
  const story = STORY_WORD_BUDGET
  const storyText = `${lint.storyWords}/${story.min}–${story.max}`
  const steps = lint.steps.map((step) => `${step.section} ${over(step.words, step.budget)}`).join('  ')
  console.log(
    `  story ${(lint.storyWords < story.min || lint.storyWords > story.max ? red : green)(storyText)}  ${steps}  asides ${over(lint.asides, 0)}`
  )
  const cards = lint.problems.filter((problem) => problem.startsWith('codex '))
  const banned = lint.banned.map((use) => `${use.section} "${use.phrase}"`)
  if (banned.length > 0) {
    console.log(`  banned: ${red(banned.join(', '))}`)
  }
  console.log(
    `  codex: ${cards.length === 0 ? green(`${lint.cards.length} cards within budget`) : red(cards.join('; '))}`
  )
}

function describeViolation(content: LoadedContent, violation: ConceptViolation): string {
  const numberOf = (id: string) => labelOf(content, id)?.number ?? id
  const where = numberOf(violation.levelId)
  switch (violation.kind) {
    case 'used-before-taught':
      return `${violation.concept}: used in ${where}, ${violation.other ? `taught later in ${numberOf(violation.other)}` : 'never taught'}`
    case 'taught-twice':
      return `${violation.concept}: taught in ${violation.other ? numberOf(violation.other) : '?'}, again in ${where}`
    case 'never-used-again':
      return `${violation.concept}: taught in ${where}, never used again`
  }
}

const loaded = loadContent(await contentFiles())
if (!loaded.ok) {
  console.error(loaded.errors.join('\n'))
  process.exit(1)
}
const content = loaded.value
const lints = content.game.levels.flatMap((level) => {
  const story = content.stories.get(level.id)
  return story ? [lintLevel(level, story)] : []
})
console.log('Content budgets (docs/LEVELS.md#concepts-and-budgets)')
for (const lint of lints) {
  printLevel(content, lint)
}

const violations = conceptChain(content.game.levels)
console.log(`\nChain of concepts: ${violations.length === 0 ? green('no breaks') : red(`${violations.length} breaks`)}`)
for (const kind of ['used-before-taught', 'taught-twice', 'never-used-again'] as const) {
  const ofKind = violations.filter((violation) => violation.kind === kind)
  if (ofKind.length > 0) {
    console.log(`  ${kind} (${ofKind.length})`)
    for (const violation of ofKind) {
      console.log(`    ${describeViolation(content, violation)}`)
    }
  }
}

const failing = lints.filter((lint) => ENFORCED_LEVELS.includes(lint.levelId) && lint.problems.length > 0)
const warned = lints.filter((lint) => lint.problems.length > 0).length
console.log(dim(`\n${lints.length - warned} green, ${warned} over budget, ${failing.length} enforced and failing`))
if (failing.length > 0) {
  process.exit(1)
}
