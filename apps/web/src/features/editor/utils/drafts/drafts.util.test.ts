import { describe, expect, it } from 'vitest'
import { refreshUntouchedDrafts, withoutLayout } from './drafts.util'

const STARTER = '#define ARGS_MAX 32\n\nint main(void)\n{\n\tdprintf(2, "%s\\n",\n\t\t"x");\n\treturn 0;\n}\n'
const OLD_STARTER = '#define ARGS_MAX\t32\n\nint main(void)\n{\n\tdprintf(2, "%s\\n", "x");\n\treturn 0;\n}\n'

describe('withoutLayout', () => {
  it('keeps the space between two words, drops it around punctuation', () => {
    expect(withoutLayout('int  x = f( a,\n\tb );')).toBe('int x=f(a,b);')
    expect(withoutLayout('int x')).not.toBe(withoutLayout('intx'))
  })
})

describe('refreshUntouchedDrafts', () => {
  it('swaps a draft saved before the starter was reformatted for the new starter', () => {
    expect(refreshUntouchedDrafts({ 'a.c': OLD_STARTER }, { 'a.c': STARTER })).toEqual({ 'a.c': STARTER })
  })

  it("never touches the player's edits", () => {
    const edited = OLD_STARTER.replace('return 0', 'return 1')
    const drafts = { 'a.c': edited }
    expect(refreshUntouchedDrafts(drafts, { 'a.c': STARTER })).toBe(drafts)
  })

  it('keeps files the starter does not have', () => {
    const drafts = { 'notes.c': 'int x;' }
    expect(refreshUntouchedDrafts(drafts, { 'a.c': STARTER })).toBe(drafts)
  })
})
