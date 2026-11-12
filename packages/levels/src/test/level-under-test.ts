import type { CheckInput, CheckVerdict, LevelChecker, LevelDefinition, LevelId } from '@kernelfall/game/types'
import { evaluateCheck, mergeVerdicts } from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import { loadedContent } from '#test/loaded-content'

/** A level as the game gets it: its validated level.yaml and its whole checker, declared checks and checker.ts. */
export interface LevelUnderTest {
  readonly level: LevelDefinition
  readonly checker: LevelChecker
}

/** One command's events alone, or the whole input the game builds for it (line and history too). */
export type JudgedCommand = readonly LabEvent[] | CheckInput

const inputOf = (command: JudgedCommand): CheckInput => ('events' in command ? command : { events: command })

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
export const verdictOf = ({ level, checker }: LevelUnderTest, runs: readonly JudgedCommand[]): CheckVerdict | null =>
  runs.reduce<CheckVerdict | null>(
    (previous, command) => mergeVerdicts(previous, evaluateCheck(level, checker, inputOf(command))),
    null
  )

/** The objective ids the level's checker reports for one command, sorted. */
export const metBy = ({ checker }: LevelUnderTest, command: JudgedCommand): string[] =>
  [...checker.check(inputOf(command)).objectivesMet].sort()

/** Whether the level judges a command at all. */
export const judges = ({ checker }: LevelUnderTest, command: JudgedCommand): boolean =>
  checker.applies?.(inputOf(command)) ?? true
