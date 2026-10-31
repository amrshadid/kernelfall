// @vitest-environment jsdom
import { useAppStore } from '@app/store'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useXrayMotion } from './useXrayMotion.hook'

function stubSystemReducedMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }))
}

afterEach(() => {
  // Unmounted first: a hook still mounted would re-render without the stubbed matchMedia.
  cleanup()
  act(() => useAppStore.getState().resetSettings())
  vi.unstubAllGlobals()
})

describe('useXrayMotion', () => {
  it('animates when neither the system nor the game asks for less motion', () => {
    stubSystemReducedMotion(false)
    expect(renderHook(() => useXrayMotion()).result.current).toBe(true)
  })

  it("steps instead when the game's Motion setting is Reduce", () => {
    stubSystemReducedMotion(false)
    const { result } = renderHook(() => useXrayMotion())
    act(() => useAppStore.getState().setMotion('reduce'))
    expect(result.current).toBe(false)
  })

  it('steps instead when the system asks for reduced motion', () => {
    stubSystemReducedMotion(true)
    expect(renderHook(() => useXrayMotion()).result.current).toBe(false)
  })
})
