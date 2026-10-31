// @vitest-environment jsdom
import type { ClarityWindow } from '@features/analytics/utils/clarity'
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useClarity } from './useClarity.hook'

const win = window as Window & ClarityWindow
const tags = () => document.querySelectorAll('script[src^="https://www.clarity.ms/tag/"]')

afterEach(() => {
  for (const tag of tags()) {
    tag.remove()
  }
  delete win.clarity
})

describe('useClarity', () => {
  it('loads nothing in a build without an id', () => {
    renderHook(() => useClarity(null, true))
    expect(tags()).toHaveLength(0)
    expect(win.clarity).toBeUndefined()
  })

  it('loads nothing for a player who turned recordings off', () => {
    renderHook(() => useClarity('abc123', false))
    expect(tags()).toHaveLength(0)
    expect(win.clarity).toBeUndefined()
  })

  it('loads the tag once, and leaves a running one alone when the player turns recordings off', () => {
    const { rerender } = renderHook(({ share }) => useClarity('abc123', share), { initialProps: { share: true } })
    rerender({ share: true })
    expect(tags()).toHaveLength(1)
    expect(win.clarity?.q).toBeUndefined()
    rerender({ share: false })
    expect(tags()).toHaveLength(1)
    expect(win.clarity?.q).toBeUndefined()
  })
})
