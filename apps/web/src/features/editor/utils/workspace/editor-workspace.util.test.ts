import { describe, expect, it } from 'vitest'
import { changedFiles, isSourceFile, withoutDotSlash } from './editor-workspace.util'

describe('changedFiles', () => {
  it('sends everything to a VM that has nothing, then only what differs', () => {
    const files = { 'a.c': 'int a;', Makefile: 'all:' }
    expect(changedFiles(null, files)).toBe(files)
    expect(changedFiles(files, { ...files, 'a.c': 'int b;' })).toEqual({ 'a.c': 'int b;' })
    expect(changedFiles(files, { ...files })).toBeNull()
  })
})

describe('withoutDotSlash', () => {
  it("drops the leading ./ gcc prints, as the editor's tabs name files", () => {
    expect(withoutDotSlash('././a.c')).toBe('a.c')
    expect(withoutDotSlash('dir/a.c')).toBe('dir/a.c')
  })
})

describe('isSourceFile', () => {
  it('knows C sources and headers from everything else', () => {
    expect(['a.c', 'util.h', 'Makefile', 'notes.txt'].map(isSourceFile)).toEqual([true, true, false, false])
  })
})
