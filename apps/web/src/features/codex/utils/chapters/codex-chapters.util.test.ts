import type { CodexCardState, CodexChapter, RegionOutline } from '@kernelfall/game/types'
import { describe, expect, it } from 'vitest'
import { codexCount, codexGroups, selectedCard } from './codex-chapters.util'

const mainline: RegionOutline = {
  id: 'mainline',
  name: 'Mainline',
  boss: false,
  caption: 'Upstream',
  source: 'MAINTAINERS',
  guide: 'init',
  layer: 'deep',
  slots: [],
}

const card = (id: string, state: CodexCardState) => ({
  card: { id, term: `${id}(2)`, summary: id, sources: ['kernel/fork.c'], docs: 'https://man7.org', tryIt: id },
  levelId: `level-of-${id}`,
  state,
})

/** Act II and Act III each have a Mainline: two chapters with the same region id. */
const CHAPTERS: readonly CodexChapter[] = [
  { act: 'act2', region: mainline, cards: [card('fork', 'filed'), card('exec', 'seen'), card('wait', 'hidden')] },
  { act: 'act3', region: mainline, cards: [card('mmap', 'hidden')] },
]

describe('codexGroups', () => {
  it('keys each chapter by act and region, so the two Mainlines stay apart', () => {
    expect(codexGroups(CHAPTERS).map((group) => [group.key, group.name])).toEqual([
      ['act2/mainline', 'Mainline'],
      ['act3/mainline', 'Mainline'],
    ])
  })

  it('lists the cards found so far with their state and link, and only counts the rest', () => {
    const [act2, act3] = codexGroups(CHAPTERS)
    expect(act2?.entries).toEqual([
      { id: 'fork', term: 'fork(2)', href: '#/codex/fork', state: 'filed' },
      { id: 'exec', term: 'exec(2)', href: '#/codex/exec', state: 'seen' },
    ])
    expect([act2?.hidden, act3?.hidden, act3?.entries]).toEqual([1, 1, []])
  })
})

describe('selectedCard', () => {
  it('opens the card in the address once found, and the first filed one without an address', () => {
    expect(selectedCard(CHAPTERS, 'exec')?.card.id).toBe('exec')
    expect(selectedCard(CHAPTERS, null)?.card.id).toBe('fork')
  })

  it('never shows a hidden or unknown card', () => {
    expect(selectedCard(CHAPTERS, 'wait')).toBeUndefined()
    expect(selectedCard(CHAPTERS, 'nope')).toBeUndefined()
  })
})

describe('codexCount', () => {
  it('counts the filed cards out of every card in the Codex', () => {
    expect(codexCount(CHAPTERS)).toEqual({ filed: 1, total: 4 })
  })
})
