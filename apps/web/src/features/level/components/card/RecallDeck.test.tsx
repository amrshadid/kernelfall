// @vitest-environment jsdom
import type { LevelRecall } from '@features/level/types'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RecallDeck } from './RecallDeck'

const recall = (onMark = vi.fn()): LevelRecall => ({
  title: 'Before you go on',
  note: '1 card from earlier levels.',
  cards: [{ id: 'kernel', term: 'the kernel', answer: 'The one program with full control.', seenIn: 'P.1 Power On' }],
  onMark,
})

describe('RecallDeck', () => {
  afterEach(cleanup)

  it('keeps the answer face down until the player turns the card', () => {
    render(<RecallDeck recall={recall()} />)
    expect(screen.getByText('the kernel')).toBeTruthy()
    expect(screen.queryByText('The one program with full control.')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Turn the card' }))
    expect(screen.getByText('The one program with full control.')).toBeTruthy()
  })

  it("keeps the player's own call, once", () => {
    const onMark = vi.fn()
    render(<RecallDeck recall={recall(onMark)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Turn the card' }))
    fireEvent.click(screen.getByRole('button', { name: 'Not yet' }))

    expect(onMark).toHaveBeenCalledExactlyOnceWith('kernel', false)
    expect(screen.getByText('Comes back sooner')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Not yet' })).toBeNull()
  })
})
