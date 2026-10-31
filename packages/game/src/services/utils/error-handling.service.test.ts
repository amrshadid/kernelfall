import { describe, expect, it } from 'vitest'
import {
  handleStorageError,
  invalidSaveError,
  lockedLevelError,
  noActiveLevelError,
  nothingToRestoreError,
  saveFailedError,
  unknownLevelError,
} from '#services/utils/error-handling.service'
import { SAVE_ISSUES } from '#types/definitions/saves'

/** A thrown error that names its own failure, as an `AppError` does. */
const coded = (code: string, message: string) => Object.assign(new Error(message), { code })

describe('handleStorageError', () => {
  it('reports a plain storage failure (full, or blocked in a private window) as UNAVAILABLE', () => {
    expect(handleStorageError(new Error('quota exceeded')).error).toMatchObject({
      code: 'UNAVAILABLE',
      message: 'quota exceeded',
    })
  })

  it('keeps the code of an error that carries one', () => {
    expect(handleStorageError(coded('FORBIDDEN', 'denied')).error?.code).toBe('FORBIDDEN')
  })
})

describe('game errors', () => {
  it('names the level that is unknown or locked', () => {
    expect(unknownLevelError('nope').error).toMatchObject({ code: 'NOT_FOUND', message: 'unknown level "nope"' })
    expect(lockedLevelError('act1-x-01-y').error).toMatchObject({
      code: 'FORBIDDEN',
      message: 'level "act1-x-01-y" is locked',
    })
  })

  it('says what to do when no level is active, and when there is no code to restore', () => {
    expect(noActiveLevelError()).toMatchObject({ success: false, error: { code: 'NOT_READY' } })
    expect(nothingToRestoreError()).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } })
  })

  it('leads an invalid save with its first problem and keeps them all in details', () => {
    const errors = ['version: expected a number', 'progress: expected an object']
    expect(invalidSaveError(errors).error).toEqual({
      code: 'VALIDATION_ERROR',
      message: errors[0],
      details: errors,
    })
    expect(invalidSaveError([]).error?.message).toBe('The save is not valid.')
  })

  it('reports a failed save as UNAVAILABLE with the issue in details', () => {
    expect(saveFailedError(SAVE_ISSUES.writeFailed).error).toMatchObject({
      code: 'UNAVAILABLE',
      details: SAVE_ISSUES.writeFailed,
    })
  })
})
