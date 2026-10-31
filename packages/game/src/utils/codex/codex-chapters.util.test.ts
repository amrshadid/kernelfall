import { describe, expect, it } from 'vitest'
import { contentOf, EXAMPLE_LEVEL, EXAMPLE_LEVEL_YAML, exampleLevel, FOLLOW_UP_LEVEL } from '#test/index'
import type { CodexChapter } from '#types/definitions/codex'
import type { LevelDefinition } from '#types/definitions/level'
import type { Progress } from '#types/definitions/progress'
import { codexChapters } from '#utils/codex/codex-chapters.util'
import { emptyProgress, startLevel } from '#utils/progress/index'

const STARTED_AT = 1_000
const exitStatusCard = { ...EXAMPLE_LEVEL_YAML.codex[0], id: 'exit-status', term: 'exit status' }

/** The follow-up level, adding the first level's card too. */
const SHARING: LevelDefinition = { ...FOLLOW_UP_LEVEL, codex: EXAMPLE_LEVEL.codex }

/** The first level, moved to Act I's Mainline. */
const ACT1_MAINLINE = exampleLevel({ id: 'act1-mainline-01-first-write' }, { act: 'act1', region: 'mainline' })

/** Each chapter as `act/region: card ids`, to compare the whole Codex at a glance. */
const outline = (chapters: readonly CodexChapter[]) =>
  chapters.map((chapter) => `${chapter.act}/${chapter.region.id}: ${chapter.cards.map((entry) => entry.card.id)}`)

const states = (chapters: readonly CodexChapter[]) =>
  chapters.flatMap((chapter) => chapter.cards.map((entry) => [entry.card.id, entry.state]))

/** `levelId` started and passed, which files its cards. */
function completed(progress: Progress, levelId: string): Progress {
  return {
    ...progress,
    levels: progress.levels.map((record) =>
      record.levelId === levelId ? { ...record, completedAt: STARTED_AT } : record
    ),
    completionOrder: [...progress.completionOrder, levelId],
  }
}

describe('codexChapters', () => {
  const content = contentOf([EXAMPLE_LEVEL, FOLLOW_UP_LEVEL])

  it('makes one chapter per region, its cards in play order, each with the level that adds it', () => {
    const [chapter, ...rest] = codexChapters(emptyProgress(), content)

    expect(rest).toEqual([])
    expect(chapter?.act).toBe('act1')
    expect(chapter?.region.id).toBe(EXAMPLE_LEVEL.region)
    expect(chapter?.cards.map((entry) => [entry.card.id, entry.levelId])).toEqual([
      ['write-syscall', EXAMPLE_LEVEL.id],
      ['exit-status', FOLLOW_UP_LEVEL.id],
    ])
  })

  it('hides cards of levels not started, shows them once started and files them once passed', () => {
    expect(states(codexChapters(emptyProgress(), content))).toEqual([
      ['write-syscall', 'hidden'],
      ['exit-status', 'hidden'],
    ])

    const started = startLevel(emptyProgress(), EXAMPLE_LEVEL, STARTED_AT).progress
    expect(states(codexChapters(started, content))).toEqual([
      ['write-syscall', 'seen'],
      ['exit-status', 'hidden'],
    ])

    expect(states(codexChapters(completed(started, EXAMPLE_LEVEL.id), content))).toEqual([
      ['write-syscall', 'filed'],
      ['exit-status', 'hidden'],
    ])
  })

  it('places a card two levels share once, in the chapter of the first, and files it with either', () => {
    const shared = contentOf([EXAMPLE_LEVEL, SHARING])

    expect(outline(codexChapters(emptyProgress(), shared))).toEqual([`act1/${EXAMPLE_LEVEL.region}: write-syscall`])
    const [entry] = codexChapters(emptyProgress(), shared)[0]?.cards ?? []
    expect(entry?.levelId).toBe(EXAMPLE_LEVEL.id)

    // Only the later level is passed: the card is still filed where it first appears.
    const later = completed(startLevel(emptyProgress(), SHARING, STARTED_AT).progress, SHARING.id)
    expect(states(codexChapters(later, shared))).toEqual([['write-syscall', 'filed']])
  })

  it('shows a shared card as seen once the later level that adds it is started', () => {
    const shared = contentOf([EXAMPLE_LEVEL, SHARING])

    const startedLater = startLevel(emptyProgress(), SHARING, STARTED_AT).progress
    expect(states(codexChapters(startedLater, shared))).toEqual([['write-syscall', 'seen']])
  })

  it('keeps regions with the same id in two acts as separate chapters', () => {
    const second = exampleLevel(
      {
        id: 'act2-mainline-01-exit-status',
        skills: ['exit-status'],
        prerequisites: ['write-to-stdout'],
        codex: [exitStatusCard],
      },
      { act: 'act2', region: 'mainline' }
    )

    expect(outline(codexChapters(emptyProgress(), contentOf([ACT1_MAINLINE, second])))).toEqual([
      'act1/mainline: write-syscall',
      'act2/mainline: exit-status',
    ])
  })

  it('leaves out a region whose cards all appeared earlier', () => {
    const repeat = exampleLevel(
      { id: 'act2-mainline-01-write-again', skills: ['exit-status'], prerequisites: ['write-to-stdout'] },
      { act: 'act2', region: 'mainline' }
    )

    expect(outline(codexChapters(emptyProgress(), contentOf([ACT1_MAINLINE, repeat])))).toEqual([
      'act1/mainline: write-syscall',
    ])
  })
})
