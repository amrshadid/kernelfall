// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { navigateTo } from './navigate.util'

afterEach(() => {
  window.location.hash = ''
})

describe('navigateTo', () => {
  it('moves the hash to the route', () => {
    navigateTo({ name: 'play', levelId: 'act1-x-04-y', card: 'fork' })
    expect(window.location.hash).toBe('#/play/act1-x-04-y?card=fork')
  })
})
