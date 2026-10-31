// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CrossingTag } from './CrossingTag'

function tagBox(props: Parameters<typeof CrossingTag>[0]) {
  const { container } = render(
    <svg aria-label="test">
      <CrossingTag {...props} />
    </svg>
  )
  const rect = container.querySelector('rect')
  return {
    left: Number(rect?.getAttribute('x')),
    right: Number(rect?.getAttribute('x')) + Number(rect?.getAttribute('width')),
    top: Number(rect?.getAttribute('y')),
    bottom: Number(rect?.getAttribute('y')) + Number(rect?.getAttribute('height')),
    text: container.querySelector('text')?.textContent,
  }
}

describe('CrossingTag', () => {
  it('names the syscall and its number', () => {
    expect(tagBox({ name: 'clone', nr: 56, x: 28, y: 226, maxRight: 294 }).text).toBe('clone · nr 56')
  })

  it('starts where asked when there is room before the Gate', () => {
    expect(tagBox({ name: 'clone', nr: 56, x: 28, y: 226, maxRight: 294 }).left).toBe(28)
  })

  it('moves left to end short of the Gate', () => {
    const box = tagBox({ name: 'exit_group', nr: 231, x: 220, y: 226, maxRight: 294 })
    expect(box.right).toBe(294)
  })

  it('is centred on y', () => {
    const box = tagBox({ name: 'wait4', nr: 61, x: 28, y: 226, maxRight: 294 })
    expect((box.top + box.bottom) / 2).toBe(226)
  })
})
