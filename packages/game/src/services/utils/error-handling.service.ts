import { errorResponse, handleServiceError } from '@kernelfall/core/services'
import type { ServiceResponse } from '@kernelfall/core/types'
import type { LevelId } from '#types/definitions/level'
import type { SaveIssue } from '#types/definitions/saves'

/** Storage refused a write (full, or blocked in a private window). */
export const handleStorageError = (error: unknown): ServiceResponse<never> =>
  handleServiceError(error, { fallbackCode: 'UNAVAILABLE' })

export const noActiveLevelError = (): ServiceResponse<never> =>
  errorResponse('NOT_READY', 'No level is active: start a level first.')

export const unknownLevelError = (levelId: LevelId): ServiceResponse<never> =>
  errorResponse('NOT_FOUND', `unknown level "${levelId}"`)

export const lockedLevelError = (levelId: LevelId): ServiceResponse<never> =>
  errorResponse('FORBIDDEN', `level "${levelId}" is locked`)

export const nothingToRestoreError = (): ServiceResponse<never> =>
  errorResponse('NOT_FOUND', "There is no code of the player's to restore: init's version was never loaded.")

/** A save that failed validation; `details` keeps every problem, each with its path. */
export const invalidSaveError = (errors: readonly string[]): ServiceResponse<never> =>
  errorResponse('VALIDATION_ERROR', errors[0] ?? 'The save is not valid.', errors)

export const saveFailedError = (issue: SaveIssue): ServiceResponse<never> =>
  errorResponse('UNAVAILABLE', "Progress couldn't be written to storage; the game keeps it in memory.", issue)
