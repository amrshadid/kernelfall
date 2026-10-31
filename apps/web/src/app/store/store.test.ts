import { DEFAULT_SETTINGS } from '@shared/utils/settings'
import { describe, expect, it } from 'vitest'
import { useAppStore } from './store'

describe('useAppStore', () => {
  it('applies setting changes and resets to the defaults', () => {
    const store = useAppStore.getState()
    store.setTheme('light')
    store.toggleXray()
    expect(useAppStore.getState()).toMatchObject({ theme: 'light', xray: false })
    useAppStore.getState().resetSettings()
    expect(useAppStore.getState()).toMatchObject(DEFAULT_SETTINGS)
  })

  it('remembers tour stops once each, in the order they were first shown', () => {
    useAppStore.getState().markToursSeen(['title:start', 'title:menu'])
    useAppStore.getState().markToursSeen(['title:menu', 'map:drawing'])
    expect(useAppStore.getState().toursSeen).toEqual(['title:start', 'title:menu', 'map:drawing'])
    useAppStore.getState().resetToursSeen()
    expect(useAppStore.getState().toursSeen).toEqual([])
  })

  it("remembers X-ray's depth, Predict, the view per level, and what was watched and answered", () => {
    const store = useAppStore.getState()
    store.setXrayDepth('deep')
    store.setXrayPredict(false)
    store.setXrayLens('act1-04', 'processes')
    store.markXraySeen('prologue:syscalls:write')
    store.markXraySeen('prologue:syscalls:write')
    store.markXrayAutoplayed('prologue:see')
    store.setXrayGuess('prologue:syscalls:write:answer', '6')

    const stored = useAppStore.persist.getOptions().partialize?.(useAppStore.getState())
    expect(stored).toMatchObject({
      xrayDepth: 'deep',
      xrayPredict: false,
      xrayLens: { 'act1-04': 'processes' },
      xraySeen: ['prologue:syscalls:write'],
      xrayAutoplayed: ['prologue:see'],
      xrayGuesses: { 'prologue:syscalls:write:answer': '6' },
    })

    useAppStore.getState().resetSettings()
    expect(useAppStore.getState()).toMatchObject({ xrayDepth: 'simple', xraySeen: [], xrayGuesses: {} })
  })

  it('leaves the seen list as it was when a key is already there', () => {
    useAppStore.getState().markXraySeen('a')
    const before = useAppStore.getState().xraySeen
    useAppStore.getState().markXraySeen('a')
    expect(useAppStore.getState().xraySeen).toBe(before)
    useAppStore.getState().resetSettings()
  })

  it('lets the latest shortcut registration win and hands the key back when it leaves', () => {
    const first = () => {}
    const second = () => {}
    const { registerShortcut, unregisterShortcut } = useAppStore.getState()
    registerShortcut('hint', first)
    registerShortcut('hint', second)
    expect(useAppStore.getState().shortcutHandlers.hint).toBe(second)

    // The screen registered first unmounting must not take the key from the one on top.
    unregisterShortcut('hint', first)
    expect(useAppStore.getState().shortcutHandlers.hint).toBe(second)

    unregisterShortcut('hint', second)
    expect(useAppStore.getState().shortcutHandlers.hint).toBeUndefined()
    expect(useAppStore.persist.getOptions().partialize?.(useAppStore.getState())).not.toHaveProperty('shortcutHandlers')
  })

  it('keeps the cheat sheet state out of the stored settings', () => {
    useAppStore.getState().openCheatSheet()
    expect(useAppStore.getState().cheatSheetOpen).toBe(true)
    expect(useAppStore.persist.getOptions().partialize?.(useAppStore.getState())).not.toHaveProperty('cheatSheetOpen')
    useAppStore.getState().closeCheatSheet()
  })
})
