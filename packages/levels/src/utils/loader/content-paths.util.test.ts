import { describe, expect, it } from 'vitest'
import { byPlayOrder, filesIn, folderOf, leafOf, orderOf } from '#utils/loader/content-paths.util'

describe('folderOf and leafOf', () => {
  it('split a content path into its folder and its last part', () => {
    expect(folderOf('0-prologue/1-boot-path/region.yaml')).toBe('0-prologue/1-boot-path')
    expect(leafOf('0-prologue/1-boot-path')).toBe('1-boot-path')
    expect(leafOf('0-prologue')).toBe('0-prologue')
  })
})

describe('orderOf and byPlayOrder', () => {
  it('reads the number a folder name starts with', () => {
    expect(orderOf('1-act-1/2-process-district')).toEqual({ order: 2, name: 'process-district' })
    expect(orderOf('3-act-3/11-mainline')).toEqual({ order: 11, name: 'mainline' })
    expect(orderOf('prologue')).toBeNull()
  })

  it('sorts by that number, so 10 comes after 9, and puts unnumbered folders last', () => {
    expect(byPlayOrder(['a/10-x', 'unnumbered', 'a/9-y', 'a/1-z'])).toEqual(['a/1-z', 'a/9-y', 'a/10-x', 'unnumbered'])
  })
})

describe('filesIn', () => {
  it('keeps the files right inside a sub-folder, by name, in name order', () => {
    expect(
      filesIn(
        {
          'lvl/starter/b.c': 'b',
          'lvl/starter/a.c': 'a',
          'lvl/starter/deeper/c.c': 'c',
          'lvl/solution/a.c': 'x',
          'other/starter/a.c': 'y',
        },
        'lvl',
        'starter'
      )
    ).toEqual({ 'a.c': 'a', 'b.c': 'b' })
  })
})
