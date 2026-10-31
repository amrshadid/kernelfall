import type { Route } from '@shared/types/definitions/route'
import { describe, expect, it } from 'vitest'
import { hrefOf, parseRoute } from './routes.util'

describe('parseRoute', () => {
  it('reads every screen of the route table', () => {
    expect(parseRoute('')).toEqual({ name: 'title' })
    expect(parseRoute('#/')).toEqual({ name: 'title' })
    expect(parseRoute('#/map')).toEqual({ name: 'map' })
    expect(parseRoute('#/play/act1-x-04-y')).toEqual({ name: 'play', levelId: 'act1-x-04-y' })
    expect(parseRoute('#/play/act1-x-04-y?card=fork')).toEqual({ name: 'play', levelId: 'act1-x-04-y', card: 'fork' })
    expect(parseRoute('#/play/act1-x-04-y?card=')).toEqual({ name: 'play', levelId: 'act1-x-04-y' })
    expect(parseRoute('#/codex')).toEqual({ name: 'codex', cardId: null })
    expect(parseRoute('#/codex/fork')).toEqual({ name: 'codex', cardId: 'fork' })
    expect(parseRoute('#/settings/saves')).toEqual({ name: 'settings', section: 'saves' })
    expect(parseRoute('#/settings/keyboard')).toEqual({ name: 'settings', section: 'keyboard' })
    expect(parseRoute('#/settings/nosuch')).toEqual({ name: 'not-found' })
    expect(parseRoute('#/placement/prologue/surface-survey')).toEqual({
      name: 'placement',
      act: 'prologue',
      regionId: 'surface-survey',
    })
  })

  it('sends anything else to not-found', () => {
    expect(parseRoute('#/play')).toEqual({ name: 'not-found' })
    expect(parseRoute('#/settings/sound')).toEqual({ name: 'not-found' })
    expect(parseRoute('#/nowhere')).toEqual({ name: 'not-found' })
    expect(parseRoute('#/map/a/b')).toEqual({ name: 'not-found' })
    expect(parseRoute('#/placement/prologue')).toEqual({ name: 'not-found' })
    expect(parseRoute('#/placement/prologue/a/b')).toEqual({ name: 'not-found' })
  })
})

describe('hrefOf', () => {
  it('round-trips through parseRoute', () => {
    const routes: Route[] = [
      { name: 'title' },
      { name: 'map' },
      { name: 'play', levelId: 'prologue-boot-path-02-first-words' },
      { name: 'play', levelId: 'prologue-boot-path-02-first-words', card: 'write-syscall' },
      { name: 'codex', cardId: 'fork' },
      { name: 'codex', cardId: null },
      { name: 'settings', section: null },
      { name: 'settings', section: 'saves' },
      { name: 'placement', act: 'prologue', regionId: 'machine-in-section' },
    ]
    for (const route of routes) {
      expect(parseRoute(hrefOf(route))).toEqual(route)
    }
  })
})
