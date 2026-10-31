import { describe, expect, it } from 'vitest'
import { loadReferenceFiles, referenceLoadersFor } from '#utils/solutions/reference-files.util'

const text = (value: string) => () => Promise.resolve(value)

describe('referenceLoadersFor', () => {
  it("picks the files of the level folder's own solution/, by name", () => {
    const loaders = referenceLoadersFor('0-prologue/1-boot-path/02-first-words', {
      '0-prologue/1-boot-path/02-first-words/solution/hello.c': text('a'),
      '1-act-1/2-process-district/04-run-anything/solution/ksh-lite.c': text('b'),
      '0-prologue/1-boot-path/02-first-words/starter/hello.c': text('c'),
    })

    expect(Object.keys(loaders)).toEqual(['hello.c'])
  })
})

describe('loadReferenceFiles', () => {
  it("loads the Prologue's hello.c", async () => {
    const files = await loadReferenceFiles('prologue-boot-path-02-first-words')

    expect(Object.keys(files ?? {})).toEqual(['hello.c'])
    expect(files?.['hello.c']).toContain('write(')
  })

  it('is null for a level without a solution', async () => {
    expect(await loadReferenceFiles('no-such-level-99-nothing')).toBeNull()
  })
})
