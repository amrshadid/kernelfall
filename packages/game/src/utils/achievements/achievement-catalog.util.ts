import type { Achievement, AchievementContext } from '#types/definitions/achievements'
import { ACTS } from '#types/definitions/level'
import type { LevelResult } from '#types/definitions/progress'
import { collectCodex } from '#utils/codex/index'
import { levelTaint } from '#utils/taint/index'

// PROVISIONAL: example achievements, to be reviewed with the story and tuned after playtests.

const CODEX_COLLECTOR_CARDS = 5
const PERSISTENT_ATTEMPTS = 5

function results({ progress }: AchievementContext): readonly LevelResult[] {
  return progress.levels.flatMap((level) => [level.lastResult, level.best].filter((result) => result !== null))
}

const byPlayer = (result: LevelResult) => result.via === 'player'

function hasSpotlessAct(context: AchievementContext): boolean {
  const { progress, content } = context
  return ACTS.some((act) => {
    const levels = content.levels.filter((level) => level.act === act)
    return (
      levels.length > 0 &&
      levels.every((level) => {
        const record = progress.levels.find((candidate) => candidate.levelId === level.id)
        return record?.lastResult?.via === 'player' && levelTaint(progress.taint, level.id) === 0
      })
    )
  })
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'first-repair',
    title: 'First Repair',
    description: 'Pass a level with your own code.',
    isEarned: (context) => results(context).some(byPlayer),
  },
  {
    id: 'on-your-own',
    title: 'On Your Own',
    description: 'Pass a level with your own code without revealing a hint.',
    isEarned: (context) => results(context).some((result) => byPlayer(result) && result.hintsRevealed === 0),
  },
  {
    id: 'clean-build',
    title: 'Clean Build',
    description: 'Pass a level with your own code and zero Taint.',
    isEarned: (context) => results(context).some((result) => byPlayer(result) && result.taint === 0),
  },
  {
    id: 'first-oops',
    title: 'First Oops',
    description: 'Crash the kernel and read your first oops. Nothing is lost: the lab is restored.',
    isEarned: ({ progress }) => progress.levels.some((level) => level.oopses > 0),
  },
  {
    id: 'try-try-again',
    title: 'Try, Try Again',
    description: `Pass a level with your own code after ${PERSISTENT_ATTEMPTS} or more checker runs.`,
    isEarned: (context) =>
      results(context).some((result) => byPlayer(result) && result.attempts >= PERSISTENT_ATTEMPTS),
  },
  {
    id: 'spotless-act',
    title: 'Spotless',
    description: 'Finish every level of an act with your own code and zero Taint.',
    isEarned: hasSpotlessAct,
  },
  {
    id: 'archivist',
    title: 'Archivist',
    description: `Collect ${CODEX_COLLECTOR_CARDS} Codex cards.`,
    isEarned: ({ progress, content }) => collectCodex(progress, content).length >= CODEX_COLLECTOR_CARDS,
  },
]
