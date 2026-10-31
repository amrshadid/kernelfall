import { useEventListener } from '@kernelfall/core/hooks'
import type { AchievementUnlockedPayload } from '#events/types'
import { GAME_EVENTS } from '#events/types'

/** Each achievement as the player earns it (a notice). */
export function useAchievementUnlocked(handler: (achievement: AchievementUnlockedPayload) => void): void {
  useEventListener<AchievementUnlockedPayload>(GAME_EVENTS.ACHIEVEMENT_UNLOCKED, (event) => handler(event.payload))
}
