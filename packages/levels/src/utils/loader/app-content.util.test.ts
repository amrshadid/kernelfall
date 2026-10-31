import { describe, expect, it } from 'vitest'
import { appContent } from '#utils/loader/app-content.util'

describe('appContent', () => {
  it('loads the content once and hands out the same result', () => {
    const first = appContent()

    expect(first.ok).toBe(true)
    expect(appContent()).toBe(first)
  })
})
