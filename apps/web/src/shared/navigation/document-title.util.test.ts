import { CONTENT_FILES, loadContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { documentTitleOf, screenTitleOf } from './document-title.util'

const loaded = loadContent(CONTENT_FILES)
if (!loaded.ok) {
  throw new Error(loaded.errors.join('\n'))
}
const content = loaded.value

describe('documentTitleOf', () => {
  it.each([
    [{ name: 'title' } as const, 'Kernelfall: rebuild a fallen machine'],
    [{ name: 'map' } as const, 'Kernel Map · Kernelfall'],
    [{ name: 'play', levelId: 'act1-process-district-04-run-anything' } as const, '1.4 Run Anything · Kernelfall'],
    [{ name: 'play', levelId: 'prologue-boot-path-02-first-words' } as const, 'Prologue: First Words · Kernelfall'],
    [{ name: 'play', levelId: 'nope' } as const, 'Level · Kernelfall'],
    [
      { name: 'play', levelId: 'prologue-boot-path-02-first-words', card: 'write-syscall' } as const,
      'write(2) · Codex · Kernelfall',
    ],
    [{ name: 'codex', cardId: null } as const, 'Codex · Kernelfall'],
    [{ name: 'codex', cardId: 'write-syscall' } as const, 'write(2) · Codex · Kernelfall'],
    [{ name: 'settings', section: null } as const, 'Settings · Kernelfall'],
    [
      { name: 'placement', act: 'prologue', regionId: 'machine-in-section' } as const,
      'The Machine in Section: placement check · Kernelfall',
    ],
    [{ name: 'placement', act: 'prologue', regionId: 'nope' } as const, 'Placement check · Kernelfall'],
    [{ name: 'not-found' } as const, 'Page not found · Kernelfall'],
  ])('titles %o as %s', (route, title) => {
    expect(documentTitleOf(route, content)).toBe(title)
  })
})

describe('screenTitleOf', () => {
  it('names the screen that replaces the route when content fails or the window is narrow', () => {
    const map = { name: 'map' } as const
    expect(screenTitleOf(map, null, true)).toBe('Content errors · Kernelfall')
    expect(screenTitleOf(map, content, false)).toBe('Needs a bigger screen · Kernelfall')
    expect(screenTitleOf(map, content, true)).toBe('Kernel Map · Kernelfall')
  })
})
