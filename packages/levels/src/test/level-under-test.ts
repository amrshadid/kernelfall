import type { CheckVerdict, LevelChecker, LevelDefinition, LevelId } from '@kernelfall/game/types'
import { evaluateCheck, mergeVerdicts } from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import { loadedContent } from '#test/loaded-content'

/** A level as the game gets it: its validated level.yaml and its whole checker, declared checks and checker.ts. */
export interface LevelUnderTest {
  readonly level: LevelDefinition
  readonly checker: LevelChecker
}

let content: ReturnType<typeof loadedContent> | null = null

/** The level with id `levelId` from the repository's content; throws if it or its checker is missing. */
export function levelUnderTest(levelId: LevelId): LevelUnderTest {
  content ??= loadedContent()
  const level = content.game.level(levelId)
  const checker = content.game.checker(levelId)
  if (!level || !checker) {
    throw new Error(`${levelId} is not a built level with a checker`)
  }
  return { level, checker }
}

/** The verdict over several commands, merged as the game merges them over a play-through. */
export const verdictOf = (
  { level, checker }: LevelUnderTest,
  runs: readonly (readonly LabEvent[])[]
): CheckVerdict | null =>
  runs.reduce<CheckVerdict | null>(
    (previous, events) => mergeVerdicts(previous, evaluateCheck(level, checker, { events })),
    null
  )

/** The objective ids the level's checker reports for one command, sorted. */
export const metBy = ({ checker }: LevelUnderTest, events: readonly LabEvent[]): string[] =>
  [...checker.check({ events }).objectivesMet].sort()

/** Whether the level judges a command at all. */
export const judges = ({ checker }: LevelUnderTest, events: readonly LabEvent[]): boolean =>
  checker.applies?.({ events }) ?? true
