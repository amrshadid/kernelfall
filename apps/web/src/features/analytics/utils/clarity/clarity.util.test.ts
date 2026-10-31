// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { CLARITY_SCRIPT_ID } from './clarity.constants'
import { type ClarityWindow, isClarityLoaded, loadClarity } from './clarity.util'

const tags = () => document.querySelectorAll(`script#${CLARITY_SCRIPT_ID}`)

afterEach(() => {
  for (const tag of tags()) {
    tag.remove()
  }
})

describe('loadClarity', () => {
  it("adds Clarity's tag once, with the queue its snippet sets up, and calls nothing", () => {
    const win: ClarityWindow = {}
    expect(isClarityLoaded(document)).toBe(false)
    loadClarity('abc123', win, document)
    loadClarity('abc123', win, document)
    expect(tags()).toHaveLength(1)
    const tag = tags()[0] as HTMLScriptElement
    expect(tag.src).toBe('https://www.clarity.ms/tag/abc123')
    expect(tag.async).toBe(true)
    expect(typeof win.clarity).toBe('function')
    expect(win.clarity?.q).toBeUndefined()
  })

  it('keeps a Clarity API that is already there', () => {
    const api = () => {}
    const win: ClarityWindow = { clarity: api }
    loadClarity('abc123', win, document)
    expect(win.clarity).toBe(api)
  })
})
