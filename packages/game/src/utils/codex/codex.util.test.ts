import { describe, expect, it } from 'vitest'
import { EXAMPLE_LEVEL, exampleContent, FOLLOW_UP_LEVEL } from '#test/index'
import { collectCodex } from '#utils/codex/codex.util'
import { emptyProgress } from '#utils/progress/index'

describe('collectCodex', () => {
  it('collects cards of completed levels in completion order', () => {
    const content = exampleContent()
    expect(collectCodex(emptyProgress(), content)).toEqual([])
    const progress = {
      ...emptyProgress(),
      completionOrder: [FOLLOW_UP_LEVEL.id, EXAMPLE_LEVEL.id],
    }
    expect(collectCodex(progress, content).map((entry) => [entry.card.id, entry.levelId])).toEqual([
      ['exit-status', FOLLOW_UP_LEVEL.id],
      ['write-syscall', EXAMPLE_LEVEL.id],
    ])
  })

  it('shows a card shared by two levels once', () => {
    const content = exampleContent()
    const shared = { ...FOLLOW_UP_LEVEL, codex: EXAMPLE_LEVEL.codex }
    const progress = { ...emptyProgress(), completionOrder: [EXAMPLE_LEVEL.id, shared.id] }
    const sharedContent = {
      ...content,
      level: (id: string) => (id === shared.id ? shared : content.level(id)),
    }
    expect(collectCodex(progress, sharedContent)).toHaveLength(1)
  })
})
