import { describe, expect, it } from 'vitest'
import { contentOf, EXAMPLE_LEVEL, FOLLOW_UP_LEVEL } from '#test/index'
import type { GameContent } from '#types/definitions/content'
import type { LevelDefinition } from '#types/definitions/level'
import type { Progress } from '#types/definitions/progress'
import type { TaintEntry } from '#types/definitions/taint'
import { emptyProgress } from '#utils/progress/index'
import { summarizeProgress } from '#utils/summary/progress-summary.util'

const ACT2_LEVEL: LevelDefinition = {
  ...FOLLOW_UP_LEVEL,
  id: 'act2-module-docks-01-hello-module',
  act: 'act2',
  skills: [],
}

const content = (): GameContent => contentOf([EXAMPLE_LEVEL, FOLLOW_UP_LEVEL, ACT2_LEVEL])

const taint = (levelId: string, points: number): TaintEntry => ({
  levelId,
  ruleId: 'leak',
  kind: 'memory_leak',
  points,
  detail: 'a buffer was never freed',
})

function progressWith(entries: readonly TaintEntry[], completed: readonly string[]): Progress {
  return { ...emptyProgress(), taint: entries, completionOrder: completed }
}

describe('summarizeProgress', () => {
  it('counts completed levels overall and per act', () => {
    const summary = summarizeProgress(progressWith([], [EXAMPLE_LEVEL.id]), content())

    expect(summary.overall).toEqual({ completed: 1, total: 3, percent: 33 })
    expect(summary.acts.map((act) => [act.act, act.completed, act.total])).toEqual([
      ['act1', 1, 2],
      ['act2', 0, 1],
    ])
  })

  it('shows Act I Taint but leaves it out of the projected ending', () => {
    const summary = summarizeProgress(
      progressWith([taint(EXAMPLE_LEVEL.id, 10), taint(FOLLOW_UP_LEVEL.id, 10)], []),
      content()
    )

    expect(summary.totalTaint).toBe(20)
    expect(summary.acts.find((act) => act.act === 'act1')?.taint).toBe(20)
    expect(summary.projectedEnding).toBe('clean_reboot')
  })

  it('picks the projected ending from Act II Taint', () => {
    const summary = summarizeProgress(progressWith([taint(ACT2_LEVEL.id, 10)], []), content())

    expect(summary.acts.find((act) => act.act === 'act2')?.taint).toBe(10)
    expect(summary.projectedEnding).toBe('unstable_reboot')
  })

  it('starts empty', () => {
    const summary = summarizeProgress(emptyProgress(), content())

    expect(summary.totalTaint).toBe(0)
    expect(summary.achievements).toBe(0)
    expect(summary.activeMs).toBe(0)
    expect(summary.codexCards).toBe(0)
    expect(summary.skills.completed).toBe(0)
  })
})
