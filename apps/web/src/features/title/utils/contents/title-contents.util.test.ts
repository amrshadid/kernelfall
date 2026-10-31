import { hrefOf } from '@shared/navigation'
import { describe, expect, it, vi } from 'vitest'
import { continueTargetOf, lastPlayedText, titleContentsOf } from './title-contents.util'

const label = {
  levelId: 'run-anything',
  number: '1.4',
  title: 'Run Anything',
  heading: '1.4 Run Anything',
  regionName: 'Process District',
  actName: 'Act I: Userland',
}

describe('titleContentsOf', () => {
  it('lists New game, then the map with the act progress, the Codex and Settings', () => {
    const onNewGame = vi.fn()
    const contents = titleContentsOf({
      actName: 'Act I',
      actSummary: { act: 'act1', completed: 3, total: 10, percent: 30, taint: 0 },
      codexCards: 1,
      onNewGame,
    })
    expect(contents.map((entry) => entry.id)).toEqual(['new', 'map', 'codex', 'settings'])
    expect(contents[1]?.reference).toBe('Act I, 3 of 10 rebuilt')
    expect(contents[2]?.reference).toBe('1 card filed')
    contents[0]?.onSelect?.()
    expect(onNewGame).toHaveBeenCalledOnce()
  })

  it('names the Machine before an act has levels and counts cards in the plural', () => {
    const contents = titleContentsOf({ actName: 'Act I', actSummary: undefined, codexCards: 0, onNewGame: () => {} })
    expect(contents[1]?.reference).toBe('the Machine')
    expect(contents[2]?.reference).toBe('0 cards filed')
  })
})

describe('continueTargetOf', () => {
  it('links to the level and says where and which step', () => {
    const target = continueTargetOf({
      target: { levelId: 'run-anything', phase: 'build' },
      label,
      lastPlayed: ' · last played just now',
    })
    expect(target.href).toBe(hrefOf({ name: 'play', levelId: 'run-anything' }))
    expect(target.where).toBe('Act I · Process District · 1.4 Run Anything')
    expect(target.step.endsWith(' · last played just now')).toBe(true)
  })

  it('says a region named like its only level once', () => {
    const prologue = { ...label, actName: 'Prologue', regionName: 'First Boot', heading: 'First Boot' }
    const target = continueTargetOf({
      target: { levelId: 'first-boot', phase: 'build' },
      label: prologue,
      lastPlayed: '',
    })
    expect(target.where).toBe('Prologue · First Boot')
  })
})

describe('lastPlayedText', () => {
  it('is empty before the first save', () => {
    expect(lastPlayedText(1000, null)).toBe('')
    expect(lastPlayedText(1000, 1000)).toBe(' · last played just now')
  })
})
