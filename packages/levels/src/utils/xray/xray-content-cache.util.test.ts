import { describe, expect, it } from 'vitest'
import { xrayContent } from '#utils/xray/xray-content-cache.util'

describe('xrayContent', () => {
  it('loads the shipped content once and hands out the same copy', () => {
    const first = xrayContent()
    expect(first.syscalls.size).toBeGreaterThan(0)
    expect(xrayContent()).toBe(first)
  })
})
