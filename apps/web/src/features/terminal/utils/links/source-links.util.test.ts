import type { SourceLocation } from '@kernelfall/machine/types'
import type { ILink, Terminal } from '@xterm/xterm'
import { describe, expect, it } from 'vitest'
import { sourceLinks } from './source-links.util'

/** A terminal whose buffer holds `lines`, as far as the link provider reads it. */
function terminalWith(lines: readonly string[]): Terminal {
  const buffer = {
    getLine: (y: number) => (lines[y] === undefined ? undefined : { translateToString: () => lines[y] }),
  }
  return { buffer: { active: buffer } } as unknown as Terminal
}

function linksOn(lines: readonly string[], row: number, reveal: (location: SourceLocation) => void = () => {}) {
  let found: ILink[] | undefined
  sourceLinks(terminalWith(lines), reveal).provideLinks(row, (links) => {
    found = links
  })
  return found
}

describe('sourceLinks', () => {
  it("links gcc's file:line:column on a 1-based row and 1-based columns", () => {
    const links = linksOn(['ksh.c:14:5: error: oops'], 1)
    expect(links).toHaveLength(1)
    expect(links?.[0]?.text).toBe('ksh.c:14:5')
    expect(links?.[0]?.range).toEqual({ start: { x: 1, y: 1 }, end: { x: 10, y: 1 } })
  })

  it('asks the editor to show the location when clicked', () => {
    const revealed: SourceLocation[] = []
    const links = linksOn(['  ./main.c:3'], 1, (location) => revealed.push(location))
    links?.[0]?.activate({} as MouseEvent, links[0].text)
    expect(revealed).toEqual([{ file: 'main.c', line: 3, column: 1 }])
  })

  it('reports no links for a line without a location, or past the buffer', () => {
    expect(linksOn(['hello'], 1)).toBeUndefined()
    expect(linksOn([], 4)).toBeUndefined()
  })
})
