import { describe, expect, it } from 'vitest'
import { findFileLocations } from './file-location.util'

describe('findFileLocations', () => {
  it("finds gcc's file:line:column", () => {
    expect(findFileLocations("ksh.c:14:5: warning: unused variable 'n'")).toEqual([
      { file: 'ksh.c', line: 14, column: 5, start: 0, end: 10 },
    ])
  })

  it('accepts file:line, headers and a leading ./', () => {
    expect(findFileLocations('see ./util.h:3 and run.c:7')).toEqual([
      { file: 'util.h', line: 3, column: 1, start: 4, end: 14 },
      { file: 'run.c', line: 7, column: 1, start: 19, end: 26 },
    ])
  })

  it("ignores things that aren't C sources", () => {
    expect(findFileLocations('make: *** [Makefile:9: bad] Error 1 at 10:42')).toEqual([])
  })
})
