// @vitest-environment jsdom
import type { Speaker } from '@shared/types'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Dialogue } from './Dialogue'

afterEach(cleanup)

const INIT: Speaker = { id: 'init', name: 'init', term: 'PID 1', portrait: <svg />, avatar: <svg /> }
const NARRATOR: Speaker = { id: 'narrator', name: '', term: '', portrait: null, avatar: null }

describe('Dialogue', () => {
  it('sets narration apart as stage directions, never as a nameless speaker', () => {
    const { container } = render(
      <Dialogue
        label="Watch it"
        lines={[
          { speaker: NARRATOR, text: 'The drawing lights up.' },
          { speaker: INIT, text: 'Who put my message on the screen?' },
          { speaker: NARRATOR, text: 'Three parts light up.' },
          { speaker: INIT, text: 'All three.' },
        ]}
      />
    )
    expect(container.querySelectorAll('.kf-dialogue__narration')).toHaveLength(2)
    expect(container.querySelectorAll('.kf-dialogue__aside')).toHaveLength(0)
    expect(container.querySelectorAll('.kf-dialogue__speaker')).toHaveLength(1)
    expect(container.querySelector('.kf-dialogue__speaker b')?.textContent).toBe('init')
    expect(container.textContent).not.toContain('·')
  })
})
