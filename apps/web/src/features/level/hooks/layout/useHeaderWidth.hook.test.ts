// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHeaderWidth } from './useHeaderWidth.hook'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

function page(headerRight: () => number) {
  document.body.innerHTML = `
    <nav><a>Map</a><div id="name" style="border-right: 2px solid black"></div></nav>
    <aside id="guide"></aside>`
  document.documentElement.style.fontSize = '16px'
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return this.id === 'name' ? new DOMRect(0, 0, headerRight(), 40) : new DOMRect(16, 100, 300, 600)
  })
}

describe('useHeaderWidth', () => {
  it("measures from the panel's left edge to the header's rule, and again on a resize", () => {
    let right = 482
    page(() => right)
    const { result } = renderHook(() => useHeaderWidth('#name', 'guide'))
    expect(result.current).toBe(29)
    right = 514
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(31)
  })

  it('stays unknown when the header is not on the page', () => {
    const { result } = renderHook(() => useHeaderWidth('#missing', 'guide'))
    expect(result.current).toBeNull()
  })
})
