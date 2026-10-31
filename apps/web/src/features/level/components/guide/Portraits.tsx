import type { SpeakerInfo } from '@features/level/types'
import { InitPortrait, WatchdogPortrait } from '@shared/components/ui'
import type { Speaker } from '@shared/types'

const PORTRAITS = { init: InitPortrait, watchdog: WatchdogPortrait } as const

/** The dialogue's portrait sizes, in px: in its header, and in a cut-in. */
const PORTRAIT_SIZE = 56
const AVATAR_SIZE = 30

/** A speaker from story.md, drawn: their portrait and cut-in avatar, or none for a voice without one. */
export function speakerWithPortraits(info: SpeakerInfo): Speaker {
  const Portrait = info.portrait === null ? null : PORTRAITS[info.portrait]
  return {
    id: info.id,
    name: info.name,
    term: info.term,
    portrait: Portrait ? <Portrait size={PORTRAIT_SIZE} /> : null,
    avatar: Portrait ? <Portrait size={AVATAR_SIZE} /> : null,
  }
}
