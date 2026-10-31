import { ERRNO_TABLE } from '@kernelfall/machine/types'

/** What the narration says when an errno has no strerror() text. */
const UNKNOWN_FAILURE = 'it failed'

/** strerror()'s text for an errno name, lowercased to sit inside a sentence. */
export function errnoMessage(name: string | null): string {
  for (const info of ERRNO_TABLE.values()) {
    if (info.name === name) {
      return info.message.toLowerCase()
    }
  }
  return UNKNOWN_FAILURE
}
