import { describe, expect, it } from 'vitest'
import { loadedContent } from '#test/index'
import { labelOf } from '#utils/label/level-label.util'

describe('labelOf', () => {
  it('numbers Act levels and names the Prologue by title', () => {
    const content = loadedContent()

    expect(labelOf(content, 'act1-process-district-04-run-anything')).toEqual({
      levelId: 'act1-process-district-04-run-anything',
      number: '1.4',
      title: 'Run Anything',
      heading: '1.4 Run Anything',
      regionName: 'Process District',
      actName: 'Act I: Userland',
    })
    expect(labelOf(content, 'prologue-boot-path-02-first-words')?.heading).toBe('First Words')
    expect(labelOf(content, 'nope')).toBeNull()
  })
})
