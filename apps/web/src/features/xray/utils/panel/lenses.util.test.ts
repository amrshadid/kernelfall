import { describe, expect, it } from 'vitest'
import { isWholeRun, lensesOf } from './lenses.util'

describe('lensesOf', () => {
  it("keeps the views this panel draws, in the level's order", () => {
    expect(lensesOf(['processes', 'memory', 'syscalls'])).toEqual([
      { id: 'processes', label: 'Processes' },
      { id: 'cpus', label: 'CPUs' },
      { id: 'syscalls', label: 'Syscalls' },
    ])
  })

  it('draws the Section view', () => {
    expect(lensesOf(['syscalls', 'section'])).toEqual([
      { id: 'syscalls', label: 'Syscalls' },
      { id: 'section', label: 'Section' },
    ])
  })

  it("opens the route for a level's files view, and nothing for a boot view until the VM's boot is drawn", () => {
    expect(lensesOf(['syscalls', 'files']).map((lens) => lens.id)).toEqual(['syscalls', 'route'])
    expect(lensesOf(['boot', 'syscalls']).map((lens) => lens.id)).toEqual(['syscalls'])
  })

  it('shows Syscalls when the level unlocks none it draws', () => {
    expect(lensesOf(undefined)).toEqual([{ id: 'syscalls', label: 'Syscalls' }])
    expect(lensesOf(['memory'])).toEqual([{ id: 'syscalls', label: 'Syscalls' }])
  })
})

describe('isWholeRun', () => {
  it('knows the views drawn at once from the ones played stage by stage', () => {
    expect(['syscalls', 'processes', 'cpus', 'route', 'section'].map((lens) => isWholeRun(lens as never))).toEqual([
      false,
      false,
      true,
      true,
      true,
    ])
  })
})
