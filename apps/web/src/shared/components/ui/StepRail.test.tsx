// @vitest-environment jsdom
import { STEPS } from '@shared/utils/level'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StepRail } from './StepRail'

afterEach(cleanup)

describe('StepRail', () => {
  it('exposes one list of steps: the measuring copies stay hidden from assistive tech', () => {
    render(<StepRail steps={STEPS} currentIndex={2} />)
    expect(screen.getAllByRole('list')).toHaveLength(1)
    expect(screen.getByRole('list', { name: 'Level steps' })).toBeTruthy()
  })

  it('keeps done steps clickable by name', () => {
    const onSelect = vi.fn()
    render(<StepRail steps={STEPS} currentIndex={2} onSelect={onSelect} />)
    const first = STEPS[0]
    screen.getByRole('button', { name: `${first?.label} (done), look again` }).click()
    expect(onSelect).toHaveBeenCalledWith(first?.id)
  })
})
