import { describe, expect, it } from 'vitest'
import { realContent } from '@/test/fixtures/map.fixture'
import { actNameOf, shortActName } from './act-name.util'

describe('shortActName', () => {
  it("drops an act's subtitle and keeps a name without one", () => {
    expect(shortActName('Act I: Userland')).toBe('Act I')
    expect(shortActName('Prologue')).toBe('Prologue')
  })
})

describe('actNameOf', () => {
  it("names an act of the outline, and falls back to the first act's name", () => {
    const { acts } = realContent()
    expect(actNameOf(acts, 'act1')).toBe('Act I')
    expect(actNameOf(acts.slice(0, 1), 'act2')).toBe('Prologue')
    expect(actNameOf([], 'act1')).toBe('')
  })
})
