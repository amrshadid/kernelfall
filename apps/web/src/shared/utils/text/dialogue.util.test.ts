import type { Speaker } from '@shared/types'
import { describe, expect, it } from 'vitest'
import { groupLines } from './dialogue.util'

const speaker = (id: string): Speaker => ({
  id,
  name: id,
  term: '',
  portrait: null,
  avatar: null,
})

describe('groupLines', () => {
  it('joins consecutive lines by the same speaker', () => {
    const init = speaker('init')
    const dog = speaker('watchdog')
    const groups = groupLines([
      { speaker: init, text: 'a' },
      { speaker: init, text: 'b' },
      { speaker: dog, text: 'c' },
      { speaker: init, text: 'd' },
    ])
    expect(groups.map((group) => [group.speaker.id, group.texts])).toEqual([
      ['init', ['a', 'b']],
      ['watchdog', ['c']],
      ['init', ['d']],
    ])
  })

  it('returns nothing for an empty scene', () => {
    expect(groupLines([])).toEqual([])
  })
})
