import { Issues } from '@kernelfall/core/utils'
import { describe, expect, it } from 'vitest'
import type { Progress } from '#types/definitions/progress'
import { emptyProgress } from '#utils/progress/index'
import { readProgress } from '#utils/saves/read-progress.util'

const FULL: Progress = {
  levels: [
    {
      levelId: 'act1-compilers-quarter-01-hello',
      firstStartedAt: 1,
      completedAt: 5,
      activeMs: 4,
      attempts: 2,
      oopses: 1,
      run: { phase: 'build', hintsRevealed: 1, attempts: 2, oopses: 1 },
      lastResult: {
        via: 'player',
        score: 90,
        taint: 1,
        hintsRevealed: 1,
        attempts: 2,
        oopses: 1,
      },
      best: null,
      code: { 'main.c': 'int main(void) { return 0; }\n' },
      labSnapshot: null,
    },
  ],
  completionOrder: ['act1-compilers-quarter-01-hello'],
  taint: [
    {
      levelId: 'act1-compilers-quarter-01-hello',
      ruleId: 'leak',
      kind: 'memory_leak',
      points: 1,
      detail: 'a buffer was never freed',
    },
  ],
  achievements: [{ id: 'first-repair', unlockedAt: 5 }],
  lastActive: { levelId: 'act1-compilers-quarter-01-hello', phase: 'build' },
}

function read(value: unknown): { readonly progress: Progress; readonly issues: Issues } {
  const issues = new Issues()
  return { progress: readProgress(value, 'progress', issues), issues }
}

describe('readProgress', () => {
  it('reads back every field of a saved progress', () => {
    const { progress, issues } = read(JSON.parse(JSON.stringify(FULL)))

    expect(progress).toEqual(FULL)
    expect(issues.result(null).ok).toBe(true)
  })

  it("reads the player's code kept beside init's version", () => {
    const level = { ...FULL.levels[0], playerCode: { 'main.c': 'mine' } }
    const { progress, issues } = read(JSON.parse(JSON.stringify({ ...FULL, levels: [level] })))

    expect(progress.levels[0]?.playerCode).toEqual({ 'main.c': 'mine' })
    expect(issues.result(null).ok).toBe(true)
  })

  it('reads an empty progress', () => {
    const { progress, issues } = read(emptyProgress())

    expect(progress).toEqual(emptyProgress())
    expect(issues.result(null).ok).toBe(true)
  })

  it('reports bad fields with their paths', () => {
    const broken = {
      ...FULL,
      taint: [{ ...FULL.taint[0], kind: 'vibes' }],
      lastActive: { levelId: 'x', phase: 'nap' },
    }
    const result = read(broken).issues.result(null)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toEqual([
        expect.stringContaining('progress.taint[0].kind'),
        expect.stringContaining('progress.lastActive.phase'),
      ])
    }
  })
})
