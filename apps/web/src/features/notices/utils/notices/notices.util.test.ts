import { CONTENT_FILES, loadContent } from '@kernelfall/levels/utils'
import { describe, expect, it } from 'vitest'
import { MAX_NOTICES } from './notices.constants'
import {
  achievementNotice,
  completionNotice,
  levelTitleOf,
  pushNotice,
  saveFailedNotice,
  shownNotice,
} from './notices.util'

describe('levelTitleOf', () => {
  it("names a level by its heading, or by its id when there's no content to read it from", () => {
    const loaded = loadContent(CONTENT_FILES)
    if (!loaded.ok) {
      throw new Error(loaded.errors.join('\n'))
    }
    expect(levelTitleOf(loaded.value, 'act1-process-district-04-run-anything')).toMatch(/Run Anything/)
    expect(levelTitleOf(loaded.value, 'nope')).toBe('nope')
    expect(levelTitleOf(null, 'act1-process-district-04-run-anything')).toBe('act1-process-district-04-run-anything')
  })
})

describe('notices', () => {
  it('words a completion by how it was earned', () => {
    const base = { levelId: 'p', score: 100, taint: 0, at: 1 }
    expect(completionNotice({ ...base, via: 'player' }, 'First Boot').text).toBe(
      'First Boot · score 100 · Taint 0, clean'
    )
    expect(completionNotice({ ...base, via: 'reference', score: 0 }, 'First Boot').text).toBe(
      "First Boot · with init's version"
    )
  })

  it('keeps one save failure, sticky, and at most a few notices', () => {
    const failed = saveFailedNotice({ issue: 'write_failed', at: 1 })
    expect(failed.sticky).toBe(true)
    let notices = pushNotice([], failed)
    notices = pushNotice(notices, saveFailedNotice({ issue: 'write_failed', at: 2 }))
    expect(notices).toHaveLength(1)
    for (let at = 0; at < 5; at++) {
      notices = pushNotice(notices, achievementNotice({ achievementId: 'a', title: 'A', at }))
    }
    expect(notices).toHaveLength(MAX_NOTICES)
    expect(notices[0]?.kind).toBe('save-failed')
  })

  it('shows the oldest notice that fades, and a save failure once nothing else waits', () => {
    const failed = saveFailedNotice({ issue: 'write_failed', at: 1 })
    const done = completionNotice({ levelId: 'p', via: 'player', score: 1, taint: 0, at: 2 }, 'P')
    const earned = achievementNotice({ achievementId: 'a', title: 'A', at: 3 })
    expect(shownNotice([])).toBeUndefined()
    expect(shownNotice([failed, done, earned])).toBe(done)
    expect(shownNotice([failed, earned])).toBe(earned)
    expect(shownNotice([failed])).toBe(failed)
  })

  it('never lets achievements push out the completion that earned them', () => {
    let notices = pushNotice([], completionNotice({ levelId: 'p', via: 'player', score: 1, taint: 0, at: 1 }, 'P'))
    for (let at = 0; at < 5; at++) {
      notices = pushNotice(notices, achievementNotice({ achievementId: `a${at}`, title: 'A', at }))
    }
    expect(notices.map((notice) => notice.kind)).toEqual(['complete', 'achievement', 'achievement'])
  })
})
