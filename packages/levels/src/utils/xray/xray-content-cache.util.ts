import type { XrayContent } from '#types/index'
import { loadXrayContent } from '#utils/xray/xray-content.util'
import { XRAY_FILES } from '#utils/xray/xray-files.util'

let loaded: XrayContent | null = null

/**
 * X-ray's content, checked once. Unlike a level, X-ray can't skip a broken
 * stage, and the files ship with the game (a test loads them), so invalid
 * content is a bug: it throws with every problem listed.
 */
export function xrayContent(): XrayContent {
  if (loaded === null) {
    const result = loadXrayContent(XRAY_FILES)
    if (!result.ok) {
      throw new Error(`X-ray content is invalid:\n${result.errors.join('\n')}`)
    }
    loaded = result.value
  }
  return loaded
}
