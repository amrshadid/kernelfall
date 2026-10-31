import { evaluateCheck } from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import type { LevelUnderTest } from '#test/index'

// Bundler file pattern, not an import: each Survey level's reference command list.
const SOLUTIONS = import.meta.glob<string>('./*/solution/commands.sh', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** The command lines of `folder`'s solution/commands.sh, comments and blank lines left out. */
export function solutionLines(folder: string): string[] {
  const text = SOLUTIONS[`./${folder}/solution/commands.sh`]
  if (text === undefined) {
    throw new Error(`${folder} has no solution/commands.sh`)
  }
  return text.split('\n').filter((line) => line.trim() !== '' && !line.startsWith('#'))
}

/** The objective ids one command meets, declared checks and checker.ts together, sorted. */
export function allMetBy({ level, checker }: LevelUnderTest, events: readonly LabEvent[]): string[] {
  const missing = new Set(evaluateCheck(level, checker, { events }).missing.map(({ id }) => id))
  return level.objectives
    .map((objective) => objective.id)
    .filter((id) => !missing.has(id))
    .sort()
}
