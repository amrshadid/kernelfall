import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, MAX_TOURS_SEEN, MAX_XRAY_KEYS } from './settings.constants'
import {
  addKey,
  migrateSettings,
  parseSettings,
  readKeys,
  readPanelSizes,
  readSettings,
  settingsOf,
} from './settings.util'

describe('parseSettings', () => {
  it('gives the defaults for nothing stored or broken JSON', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('{oops')).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid fields and defaults the invalid ones', () => {
    expect(parseSettings(JSON.stringify({ theme: 'dark', motion: 'fast', uiScale: 1.25, extra: 1 }))).toEqual({
      ...DEFAULT_SETTINGS,
      theme: 'dark',
      uiScale: 1.25,
    })
  })

  it('only accepts the offered UI scale steps', () => {
    expect(parseSettings(JSON.stringify({ uiScale: 9 })).uiScale).toBe(1)
  })

  it('keeps valid X-ray fields and drops the rest', () => {
    const settings = parseSettings(
      JSON.stringify({
        xrayDepth: 'deep',
        xrayLens: { 'level-a': 'processes', 'level-b': 'memory', 'level-c': 'route', '': 'syscalls' },
        xrayPredict: 'yes',
        xraySeen: ['a', 'a', 7, 'b'],
        xrayAutoplayed: 'nope',
        xrayGuesses: { 'a:answer': '6', 'b:answer': 6 },
      })
    )
    expect(settings).toMatchObject({
      xrayDepth: 'deep',
      xrayLens: { 'level-a': 'processes', 'level-c': 'route' },
      xrayPredict: true,
      xraySeen: ['a', 'b'],
      xrayAutoplayed: [],
      xrayGuesses: { 'a:answer': '6' },
    })
  })
})

describe('readSettings', () => {
  it('gives the defaults for anything that is not an object', () => {
    expect(readSettings(7)).toEqual(DEFAULT_SETTINGS)
    expect(readSettings(null)).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps tour ids once each, drops foreign ones and caps the list', () => {
    expect(readSettings({ toursSeen: ['a', 'a', 3, 'x'.repeat(100), 'b'] }).toursSeen).toEqual(['a', 'b'])
    const many = Array.from({ length: MAX_TOURS_SEEN + 5 }, (_, i) => `t${i}`)
    expect(readSettings({ toursSeen: many }).toursSeen).toHaveLength(MAX_TOURS_SEEN)
  })
})

describe('readSettings: recording consent', () => {
  it('is unset by default and for anything unknown, and keeps a real answer', () => {
    expect(DEFAULT_SETTINGS.clarityConsent).toBe('unset')
    expect(readSettings({ clarityConsent: 'granted' }).clarityConsent).toBe('granted')
    expect(readSettings({ clarityConsent: 'denied' }).clarityConsent).toBe('denied')
    expect(readSettings({ clarityConsent: 'yes' }).clarityConsent).toBe('unset')
    expect(readSettings({ theme: 'dark' }).clarityConsent).toBe('unset')
  })

  it('is persisted with the other settings', () => {
    expect(settingsOf({ ...DEFAULT_SETTINGS, clarityConsent: 'denied' }).clarityConsent).toBe('denied')
  })
})

describe('migrateSettings', () => {
  it('asks again for every save before version 4, keeping the rest', () => {
    const old = { theme: 'dark', shareRecordings: true, clarityConsent: 'granted' }
    expect(migrateSettings(old, 3)).toMatchObject({ theme: 'dark', clarityConsent: 'unset' })
    expect(migrateSettings({ shareRecordings: false }, 3).clarityConsent).toBe('unset')
    expect(migrateSettings({ theme: 'dark' }, 0).clarityConsent).toBe('unset')
    expect(migrateSettings({ clarityConsent: 'denied' }, 4).clarityConsent).toBe('denied')
  })

  it('drops the old opt-out field', () => {
    expect(migrateSettings({ shareRecordings: false }, 3)).not.toHaveProperty('shareRecordings')
  })
})

describe('readKeys', () => {
  it('caps the X-ray lists, keeping the most recent keys', () => {
    const many = Array.from({ length: MAX_XRAY_KEYS + 10 }, (_, i) => `k${i}`)
    expect(readKeys(many)).toHaveLength(MAX_XRAY_KEYS)
    expect(readKeys(many).at(-1)).toBe(`k${MAX_XRAY_KEYS + 9}`)
  })
})

describe('addKey', () => {
  it('appends a new key and hands back the same list for one already there', () => {
    const keys = ['a']
    expect(addKey(keys, 'b')).toEqual(['a', 'b'])
    expect(addKey(keys, 'a')).toBe(keys)
  })
})

describe('readPanelSizes', () => {
  it('keeps sizes inside their limits and defaults the rest, so a stale save never squeezes a panel shut', () => {
    expect(readPanelSizes({ guide: 24, xray: 99, editor: 'big' })).toEqual({ guide: 24, xray: null, editor: null })
    expect(readPanelSizes(null)).toEqual(DEFAULT_SETTINGS.panelSizes)
  })
})

describe('settingsOf', () => {
  it('keeps the settings and leaves everything else in the state out', () => {
    const state = { ...DEFAULT_SETTINGS, theme: 'dark' as const, cheatSheetOpen: true }
    expect(settingsOf(state)).toEqual({ ...DEFAULT_SETTINGS, theme: 'dark' })
  })
})
