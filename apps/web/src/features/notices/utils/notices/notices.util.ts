import type { Notice } from '@features/notices/types'
import type {
  AchievementUnlockedPayload,
  LevelCompletedPayload,
  LevelId,
  SaveFailedPayload,
} from '@kernelfall/game/types'
import type { LoadedContent } from '@kernelfall/levels/types'
import { labelOf } from '@kernelfall/levels/utils'
import { MAX_NOTICES } from './notices.constants'

/** The level's heading, or its id when content failed to load (it never completes a level then). */
export function levelTitleOf(content: LoadedContent | null, levelId: LevelId): string {
  return (content === null ? undefined : labelOf(content, levelId)?.heading) ?? levelId
}

export function achievementNotice(payload: AchievementUnlockedPayload): Notice {
  return {
    id: `achievement-${payload.achievementId}-${payload.at}`,
    kind: 'achievement',
    kicker: 'Achievement',
    text: payload.title,
    sticky: false,
  }
}

export function completionNotice(payload: LevelCompletedPayload, title: string): Notice {
  const taint = payload.taint === 0 ? 'Taint 0, clean' : `Taint ${payload.taint}`
  const how = payload.via === 'reference' ? "with init's version" : `score ${payload.score} · ${taint}`
  return {
    id: `complete-${payload.levelId}-${payload.at}`,
    kind: 'complete',
    kicker: 'Level complete',
    text: `${title} · ${how}`,
    sticky: false,
  }
}

export function saveFailedNotice(payload: SaveFailedPayload): Notice {
  return {
    id: `save-failed-${payload.at}`,
    kind: 'save-failed',
    kicker: 'Not saved',
    text: 'Progress is kept in this tab only; Settings can export it.',
    sticky: true,
  }
}

/** Oldest first, so a completion is read before the achievements it earned; a save failure waits until nothing else is queued. */
export function shownNotice(notices: readonly Notice[]): Notice | undefined {
  return notices.find((notice) => !notice.sticky) ?? notices[0]
}

/** Replaces an earlier save failure. Beyond MAX_NOTICES the oldest achievement gives way first. */
export function pushNotice(notices: readonly Notice[], notice: Notice): readonly Notice[] {
  const next = [
    ...notices.filter((existing) => notice.kind !== 'save-failed' || existing.kind !== 'save-failed'),
    notice,
  ]
  while (next.length > MAX_NOTICES) {
    const achievement = next.findIndex((existing) => existing.kind === 'achievement')
    next.splice(achievement === -1 ? 0 : achievement, 1)
  }
  return next
}
