import { describe, expect, it } from 'vitest'
import type { Progress } from '#types/definitions/progress'
import { SAVE_FORMAT, SAVE_VERSION } from '#types/definitions/saves'
import { emptyProgress } from '#utils/progress/index'
import { exportSave, importSave, parseJson, readSaveFile, toSaveFile } from '#utils/saves/save-file.util'

const PROGRESS: Progress = {
  levels: [
    {
      levelId: 'act1-compilers-quarter-01-hello-write',
      firstStartedAt: 10,
      completedAt: 20,
      activeMs: 5000,
      attempts: 2,
      oopses: 1,
      run: { phase: 'card', hintsRevealed: 1, attempts: 2, oopses: 1 },
      lastResult: { via: 'player', score: 90, taint: 2, hintsRevealed: 1, attempts: 2, oopses: 1 },
      best: null,
      code: { 'hello.c': '', Makefile: 'all:\n' },
      labSnapshot: null,
    },
  ],
  completionOrder: ['act1-compilers-quarter-01-hello-write'],
  taint: [
    {
      levelId: 'act1-compilers-quarter-01-hello-write',
      ruleId: 'ignored-write-error',
      kind: 'ignored_error',
      points: 2,
      detail: 'ignored',
    },
  ],
  achievements: [{ id: 'first-oops', unlockedAt: 15 }],
  lastActive: { levelId: 'act1-compilers-quarter-01-hello-write', phase: 'card' },
}

describe('parseJson', () => {
  it('parses JSON, and hands back text that is not JSON so validation can say what is wrong', () => {
    expect(parseJson('{"version":2}')).toEqual({ version: 2 })
    expect(parseJson('{"version":')).toBe('{"version":')
  })
})

describe('save files', () => {
  it('round-trips progress through JSON, as storage keeps it', () => {
    const stored = JSON.parse(JSON.stringify(toSaveFile(PROGRESS, 99)))
    expect(readSaveFile(stored)).toEqual({
      ok: true,
      value: { progress: PROGRESS, savedAt: 99, migratedFrom: null },
    })
  })

  it('treats an empty slot as a new game', () => {
    const loaded = readSaveFile(undefined)
    expect(loaded).toEqual({
      ok: true,
      value: { progress: emptyProgress(), savedAt: null, migratedFrom: null },
    })
  })

  it('exports and imports a JSON string', () => {
    const imported = importSave(exportSave(PROGRESS, 7))
    expect(imported.ok && imported.value.progress).toEqual(PROGRESS)
    expect(importSave('{not json')).toEqual({ ok: false, errors: ['the file is not valid JSON'] })
    expect(importSave('{"hello": 1}')).toEqual({ ok: false, errors: ['not a Kernelfall save'] })
  })

  it('runs migrations one version at a time', () => {
    const oldSave = { format: SAVE_FORMAT, version: 1, savedAt: 3, state: PROGRESS }
    const schema = {
      version: 2,
      migrations: [
        {
          from: 1,
          migrate: ({ state, ...rest }: Readonly<Record<string, unknown>>) => ({
            ...rest,
            progress: state,
          }),
        },
      ],
    }
    expect(readSaveFile(oldSave, schema)).toEqual({
      ok: true,
      value: { progress: PROGRESS, savedAt: 3, migratedFrom: 1 },
    })
    expect(readSaveFile(oldSave, { version: 3, migrations: schema.migrations })).toEqual({
      ok: false,
      errors: ['no migration from save version 2'],
    })
  })

  it('refuses saves from a newer game', () => {
    const future = { ...toSaveFile(PROGRESS, 1), version: SAVE_VERSION + 1 }
    expect(readSaveFile(future)).toEqual({
      ok: false,
      errors: [`the save is from a newer version of the game (save ${SAVE_VERSION + 1}, game ${SAVE_VERSION})`],
    })
  })

  it('reports corrupt fields with their path', () => {
    const corrupt = {
      ...toSaveFile(PROGRESS, 1),
      progress: { ...PROGRESS, levels: [{ ...PROGRESS.levels[0], run: { phase: 'boss' } }] },
    }
    const loaded = readSaveFile(JSON.parse(JSON.stringify(corrupt)))
    expect(loaded.ok).toBe(false)
    expect(!loaded.ok && loaded.errors[0]).toBe(
      'progress.levels[0].run.phase: expected one of scene, see, build, oops, watch, card, complete, got "boss"'
    )
  })
})
