import type { SpeakerInfo } from '@features/level/types'
import { NARRATOR, SPEAKERS } from './speakers.constants'

/** The speaker for a name in story.md; unknown names still speak, without a portrait. */
export function speakerOf(name: string | null): SpeakerInfo {
  if (name === null) {
    return NARRATOR
  }
  return SPEAKERS[name] ?? { id: name, name, term: '', portrait: null }
}
