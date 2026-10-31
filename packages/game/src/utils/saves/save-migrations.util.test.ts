import { describe, expect, it } from 'vitest'
import type { Progress } from '#types/definitions/progress'
import { SAVE_FORMAT } from '#types/definitions/saves'
import { readSaveFile } from '#utils/saves/save-file.util'

const OLD_ID = 'prologue-boot-path-01-first-boot'
const NEW_ID = 'prologue-boot-path-02-first-words'

const progressWith = (id: string): Progress => ({
  levels: [
    {
      levelId: id,
      firstStartedAt: 10,
      completedAt: 20,
      activeMs: 5000,
      attempts: 1,
      oopses: 0,
      run: null,
      lastResult: { via: 'player', score: 100, taint: 0, hintsRevealed: 0, attempts: 1, oopses: 0 },
      best: null,
      code: { 'hello.c': 'int main(void) { return 0; }\n' },
      labSnapshot: null,
    },
  ],
  completionOrder: [id],
  taint: [{ levelId: id, ruleId: 'compiler-warning', kind: 'compiler_warning', points: 1, detail: 'unused' }],
  achievements: [],
  lastActive: { levelId: id, phase: 'card' },
})

describe('save migrations', () => {
  it('moves a version 1 save of First Boot over to First Words', () => {
    const v1 = JSON.parse(
      JSON.stringify({ format: SAVE_FORMAT, version: 1, savedAt: 30, progress: progressWith(OLD_ID) })
    )

    expect(readSaveFile(v1)).toEqual({
      ok: true,
      value: { progress: progressWith(NEW_ID), savedAt: 30, migratedFrom: 1 },
    })
  })
})
