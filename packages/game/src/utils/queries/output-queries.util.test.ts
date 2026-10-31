import { describe, expect, it } from 'vitest'
import { shellSession, stamped } from '#test/index'
import { consoleBetween, isWholeWrite, writesTo, writtenTo } from '#utils/queries/output-queries.util'

describe('writesTo and writtenTo', () => {
  it("finds a process's writes on one fd and joins the bytes it handed over", () => {
    const events = shellSession()

    expect(writesTo(events, 3, 1).map((call) => call.enter.seq)).toEqual([12])
    expect(writtenTo(events, 3, 1)).toBe('bin\n')
    expect(writtenTo(events, 3, 2)).toBe('')
  })

  it("counts writev(), as bash's echo and musl's printf write on i386", () => {
    const events = stamped([
      { type: 'sys_enter', pid: 434, name: 'writev', args: [1, 0xbf9486a0, 2], data: 'hello\n' },
      { type: 'sys_exit', pid: 434, name: 'writev', ret: 6 },
    ])

    expect(writtenTo(events, 434, 1)).toBe('hello\n')
    expect(writesTo(events, 434, 1).map(isWholeWrite)).toEqual([true])
  })
})

describe('isWholeWrite', () => {
  it('is a write of at least one byte that the kernel took in full', () => {
    const short = stamped([
      { type: 'sys_enter', pid: 2, name: 'write', args: [1, 0, 4], data: 'abcd' },
      { type: 'sys_exit', pid: 2, name: 'write', ret: 2 },
      { type: 'sys_enter', pid: 2, name: 'write', args: [1, 0, 0] },
      { type: 'sys_exit', pid: 2, name: 'write', ret: 0 },
    ])

    expect(writesTo(shellSession(), 3, 1).map(isWholeWrite)).toEqual([true])
    expect(writesTo(short, 2, 1).map(isWholeWrite)).toEqual([false, false])
  })
})

describe('consoleBetween', () => {
  it('joins what reached the terminal between two events', () => {
    expect(consoleBetween(shellSession(), 0, 21)).toBe('$ bin\n')
    expect(consoleBetween(shellSession(), 11, 15)).toBe('bin\n')
  })
})
