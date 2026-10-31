import type { Notice } from '@features/notices/types'
import {
  achievementNotice,
  completionNotice,
  NOTICE_MS,
  pushNotice,
  saveFailedNotice,
  shownNotice,
} from '@features/notices/utils/notices'
import { useAchievementUnlocked, useLevelCompleted, useSaveFailed } from '@kernelfall/game/hooks'
import type { LevelId } from '@kernelfall/game/types'
import { useCallback, useEffect, useState } from 'react'

export interface UseGameNoticesResult {
  readonly notice: Notice | undefined
  /** How many more wait behind it. */
  readonly waiting: number
  readonly dismiss: (id: string) => void
}

/** One at a time; each fades a few seconds after it comes on show, a failed save stays until dismissed. */
export function useGameNotices(titleOf: (levelId: LevelId) => string): UseGameNoticesResult {
  const [notices, setNotices] = useState<readonly Notice[]>([])
  const notice = shownNotice(notices)

  const dismiss = useCallback((id: string) => {
    setNotices((current) => current.filter((existing) => existing.id !== id))
  }, [])

  const show = (next: Notice) => setNotices((current) => pushNotice(current, next))

  useLevelCompleted((completion) => show(completionNotice(completion, titleOf(completion.levelId))))
  useAchievementUnlocked((achievement) => show(achievementNotice(achievement)))
  useSaveFailed((failure) => show(saveFailedNotice(failure)))

  // The timer starts when a notice comes on show, so one waiting its turn is still read.
  useEffect(() => {
    if (!notice || notice.sticky) {
      return
    }
    const timer = setTimeout(() => dismiss(notice.id), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice, dismiss])

  return { notice, waiting: Math.max(0, notices.length - 1), dismiss }
}
