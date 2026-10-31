import type { CallGroup, XrayCall } from '@features/xray/types'
import { describe, expect, it } from 'vitest'
import { FOLD_ROW_LIMIT } from './call-list.constants'
import { callListView } from './call-list-view.util'

const call = (id: number, name = 'statx') => ({ id, name }) as XrayCall
const many = Array.from({ length: FOLD_ROW_LIMIT + 20 }, (_, i) => call(100 + i))

const group = (key: string, open: boolean): CallGroup => ({
  key,
  pid: 1,
  role: 'program',
  title: key,
  facts: [],
  count: many.length + 1,
  focused: false,
  focusedCalls: [],
  open,
  rows: [
    { kind: 'call', call: call(1, 'execve'), focused: false },
    { kind: 'fold', key: 'repeat:100', fold: 'repeat', label: 'statx × 120', calls: many, focused: false },
  ],
})

const base = { depth: 'simple', live: false, selectedId: null, toggled: new Map() } as const

describe('callListView', () => {
  it('opens what the groups say in Simple, and folds stay closed', () => {
    const view = callListView([group('a', true), group('b', false)], base)
    expect(view.groups.map((g) => g.open)).toEqual([true, false])
    expect(view.groups[1]?.rows).toEqual([])
    expect(view.groups[0]?.rows[1]).toMatchObject({ kind: 'fold', open: false, shown: [], hidden: 0 })
  })

  it('opens every group and fold in Deep, drawing a long fold only up to its limit', () => {
    const view = callListView([group('a', false)], { ...base, depth: 'deep' })
    expect(view.groups[0]?.open).toBe(true)
    expect(view.groups[0]?.rows[1]).toMatchObject({ open: true, hidden: 20 })
  })

  it('opens the group and fold that hold the selected call, unless the player closed them', () => {
    const selected = callListView([group('a', false)], { ...base, selectedId: 105 })
    expect(selected.groups[0]?.open).toBe(true)
    expect(selected.groups[0]?.rows[1]).toMatchObject({ open: true })
    const closed = callListView([group('a', false)], { ...base, selectedId: 105, toggled: new Map([['a', false]]) })
    expect(closed.groups[0]?.open).toBe(false)
  })

  it('opens a PATH search the level teaches', () => {
    const search = group('a', true)
    const taught: CallGroup = {
      ...search,
      rows: [{ kind: 'fold', key: 'path-search:1', fold: 'path-search', label: 'x', calls: [call(1)], focused: true }],
    }
    expect(callListView([taught], base).groups[0]?.rows[0]).toMatchObject({ open: true })
  })

  it('shows only the headers while the command runs', () => {
    const view = callListView([group('a', true)], { ...base, live: true, depth: 'deep' })
    expect(view.live).toBe(true)
    expect(view.groups[0]).toMatchObject({ open: false, rows: [], count: many.length + 1 })
  })
})
