import { describe, expect, it } from 'vitest'
import { formatEdit, mapCursor } from './format-edit.util'

const apply = (text: string, edit: ReturnType<typeof formatEdit>): string =>
  edit.change ? text.slice(0, edit.change.from) + edit.change.insert + text.slice(edit.change.to) : text

describe('formatEdit', () => {
  it('changes nothing when the text is already formatted', () => {
    expect(formatEdit('int x;\n', 'int x;\n', 3)).toEqual({ change: null, cursor: 3 })
  })

  it('replaces only the span that differs', () => {
    const before = 'int main(void)\n{\nreturn 0;\n}\n'
    const after = 'int main(void)\n{\n\treturn 0;\n}\n'
    const edit = formatEdit(before, after, 0)
    expect(edit.change).toEqual({ from: 17, to: 17, insert: '\t' })
    expect(apply(before, edit)).toBe(after)
  })

  it('turns any text into the formatted text', () => {
    const before = 'int  main(){return  0;}'
    const after = 'int main()\n{\n\treturn 0;\n}\n'
    expect(apply(before, formatEdit(before, after, 5))).toBe(after)
  })
})

describe('mapCursor', () => {
  it('stays before the token it touched', () => {
    // Before `return`, after the brace.
    expect(mapCursor('int f(){return 0;}', 'int f()\n{\n\treturn 0;\n}\n', 8)).toBe(11)
  })

  it('keeps its place inside a token', () => {
    // Between `ret` and `urn`.
    expect(mapCursor('{\n  return 0;\n}', '{\n\treturn 0;\n}', 7)).toBe(6)
  })

  it('stays after the last token when only space follows on its line', () => {
    expect(mapCursor('int x;   \nint y;', 'int x;\nint y;', 8)).toBe(6)
  })

  it('stays at the start of an empty file', () => {
    expect(mapCursor('  \n', '\n', 1)).toBe(0)
  })
})
