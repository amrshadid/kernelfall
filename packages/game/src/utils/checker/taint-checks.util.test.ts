import { describe, expect, it } from 'vitest'
import { shellSession } from '#test/index'
import { findTaint } from '#utils/checker/taint-checks.util'

describe('findTaint', () => {
  it('unreaped-children: names the children never waited for, at the first one forked', () => {
    expect(findTaint({ kind: 'unreaped-children' }, { events: shellSession() })).toEqual([
      { detail: '1 of 2 children were never waited for (pid 4)', seq: 18 },
    ])
    expect(findTaint({ kind: 'unreaped-children', program: 'ls' }, { events: shellSession() })).toEqual([])
  })

  it('ran-program: a process other than a judged one ran a program named', () => {
    expect(findTaint({ kind: 'ran-program', programs: ['sh', 'bash'] }, { events: shellSession() })).toEqual([
      { detail: 'pid 4 ran /bin/sh', seq: 20 },
    ])
    expect(findTaint({ kind: 'ran-program', programs: ['ksh'] }, { events: shellSession() })).toEqual([])
  })
})
