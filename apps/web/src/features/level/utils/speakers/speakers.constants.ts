import type { SpeakerInfo } from '@features/level/types'

/** By the name story.md gives them. */
export const SPEAKERS: Readonly<Record<string, SpeakerInfo>> = {
  init: { id: 'init', name: 'init', term: 'PID 1, the first userspace process', portrait: 'init' },
  'The Watchdog': { id: 'watchdog', name: 'The Watchdog', term: 'watchdog timer', portrait: 'watchdog' },
}

/** A line story.md gives no speaker. */
export const NARRATOR: SpeakerInfo = { id: 'narrator', name: '', term: '', portrait: null }
