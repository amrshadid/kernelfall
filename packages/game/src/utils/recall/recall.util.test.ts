import { describe, expect, it } from 'vitest'
import { contentOf, EXAMPLE_LEVEL, EXAMPLE_LEVEL_YAML, exampleLevel, FOLLOW_UP_LEVEL } from '#test/index'
import type { Progress } from '#types/definitions/progress'
import { emptyProgress } from '#utils/progress/index'
import { markRecall, recallDeck } from '#utils/recall/recall.util'

const card = (id: string) => ({ ...EXAMPLE_LEVEL_YAML.codex[0], id, term: id })

const PIPES = exampleLevel({
  id: 'act1-compilers-quarter-03-pipes',
  codex: [card('pipe'), card('dup2'), card('fork'), card('wait')],
})
const NEXT_REGION = exampleLevel(
  { id: 'act1-process-district-01-spawn', codex: [card('execve')] },
  { act: 'act1', region: 'process-district' }
)
const SECOND_IN_REGION = exampleLevel(
  { id: 'act1-process-district-02-reap', codex: [card('zombie')] },
  { act: 'act1', region: 'process-district' }
)

const content = contentOf([EXAMPLE_LEVEL, FOLLOW_UP_LEVEL, PIPES, NEXT_REGION, SECOND_IN_REGION])
const done = (...ids: string[]): Progress => ({ ...emptyProgress(), completionOrder: ids })
const ids = (deck: ReturnType<typeof recallDeck>) => deck.cards.map((entry) => entry.card.id)

describe('recallDeck', () => {
  it('asks nothing after the first level: there is nothing earlier to recall', () => {
    expect(recallDeck(emptyProgress(), content, EXAMPLE_LEVEL.id)).toEqual({ region: null, cards: [] })
  })

  it("asks cards of the levels completed before, never the level's own", () => {
    const deck = recallDeck(done(EXAMPLE_LEVEL.id, FOLLOW_UP_LEVEL.id), content, FOLLOW_UP_LEVEL.id)
    expect(deck.region).toBeNull()
    expect(ids(deck)).toEqual(['write-syscall'])
  })

  it('asks three cards, the missed first, then the new, then the known', () => {
    let progress = done(EXAMPLE_LEVEL.id, FOLLOW_UP_LEVEL.id, PIPES.id)
    progress = markRecall(progress, 'write-syscall', true, 10)
    progress = markRecall(progress, 'dup2', false, 20)
    expect(ids(recallDeck(progress, content, NEXT_REGION.id))).toEqual(['dup2', 'exit-status', 'pipe'])
  })

  it('asks the card known longest ago before one known just now', () => {
    let progress = done(EXAMPLE_LEVEL.id, FOLLOW_UP_LEVEL.id)
    progress = markRecall(progress, 'exit-status', true, 10)
    progress = markRecall(progress, 'write-syscall', true, 20)
    expect(ids(recallDeck(progress, content, NEXT_REGION.id))).toEqual(['exit-status', 'write-syscall'])
  })

  it("looks back over the whole region at its last level, that level's cards too", () => {
    const deck = recallDeck(done(EXAMPLE_LEVEL.id, FOLLOW_UP_LEVEL.id), content, PIPES.id)
    expect(deck.region).toEqual({ name: 'compilers-quarter', levels: 3 })
    expect(ids(deck)).toEqual(['write-syscall', 'exit-status', 'pipe', 'dup2', 'fork'])
  })

  it('leaves a region open while one of its levels is not built', () => {
    const acts = content.acts.map((act) => ({
      ...act,
      regions: act.regions.map((region) =>
        region.id === 'process-district'
          ? { ...region, slots: [{ ...region.slots[0], levelId: null }, ...region.slots.slice(1)] }
          : region
      ),
    }))
    expect(
      recallDeck(done(EXAMPLE_LEVEL.id), { ...content, acts } as typeof content, SECOND_IN_REGION.id).region
    ).toBeNull()
  })
})

describe('markRecall', () => {
  it('keeps one mark per card, counting how often it was asked', () => {
    const once = markRecall(emptyProgress(), 'pipe', false, 5)
    const twice = markRecall(once, 'pipe', true, 9)
    expect(once.recall).toEqual([{ cardId: 'pipe', knew: false, asked: 1, at: 5 }])
    expect(twice.recall).toEqual([{ cardId: 'pipe', knew: true, asked: 2, at: 9 }])
  })
})
