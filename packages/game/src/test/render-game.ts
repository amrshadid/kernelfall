import { renderHook } from '@testing-library/react'
import type { UseLevelActionsResult } from '#hooks/level/useLevelActions.hook'
import { useLevelActions } from '#hooks/level/useLevelActions.hook'
import type { UseLevelCodeResult } from '#hooks/level/useLevelCode.hook'
import { useLevelCode } from '#hooks/level/useLevelCode.hook'
import type { UseSaveActionsResult } from '#hooks/saves/useSaveActions.hook'
import { useSaveActions } from '#hooks/saves/useSaveActions.hook'

export interface GameActions {
  readonly level: UseLevelActionsResult
  readonly code: UseLevelCodeResult
  readonly saves: UseSaveActionsResult
}

/** The level, code and save actions, as a screen gets them from their hooks. Needs jsdom. */
export function renderGameActions(): GameActions {
  const { result } = renderHook(() => ({ level: useLevelActions(), code: useLevelCode(), saves: useSaveActions() }))
  return result.current
}
