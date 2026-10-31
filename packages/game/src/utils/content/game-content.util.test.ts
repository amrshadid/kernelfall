import { describe, expect, it } from 'vitest'
import { EXAMPLE_CHECKER, EXAMPLE_LEVEL, EXAMPLE_SKILLS, exampleOutline, FOLLOW_UP_LEVEL } from '#test/index'
import type { LevelDefinition } from '#types/definitions/level'
import { createGameContent } from '#utils/content/game-content.util'

const LEVELS = [EXAMPLE_LEVEL, FOLLOW_UP_LEVEL]
const parts = (levels: readonly LevelDefinition[] = LEVELS) => ({
  acts: exampleOutline(LEVELS),
  levels,
  skills: EXAMPLE_SKILLS,
})

const errorsOf = (result: ReturnType<typeof createGameContent>): readonly string[] => (result.ok ? [] : result.errors)

describe('createGameContent', () => {
  it('puts the levels in the order of the outline and finds them by id', () => {
    const content = createGameContent(parts([FOLLOW_UP_LEVEL, EXAMPLE_LEVEL]))

    expect(errorsOf(content)).toEqual([])
    if (content.ok) {
      expect(content.value.levels).toEqual(LEVELS)
      expect(content.value.acts).toEqual(exampleOutline(LEVELS))
      expect(content.value.level(FOLLOW_UP_LEVEL.id)).toBe(FOLLOW_UP_LEVEL)
      expect(content.value.level('act9-nowhere-01-missing')).toBeUndefined()
    }
  })

  it('reports a level defined twice, or placed in no slot', () => {
    expect(errorsOf(createGameContent(parts([...LEVELS, EXAMPLE_LEVEL])))).toContain(
      `level "${EXAMPLE_LEVEL.id}" is defined more than once`
    )
    const unplaced = createGameContent({ ...parts(), acts: exampleOutline([EXAMPLE_LEVEL]) })
    expect(errorsOf(unplaced)).toContain(`level "${FOLLOW_UP_LEVEL.id}" is not in any slot of the outline`)
  })

  it('reports a slot without its level, and a level in the wrong region', () => {
    expect(errorsOf(createGameContent(parts([EXAMPLE_LEVEL])))).toEqual([
      `act1/compilers-quarter: slot 2 points at "${FOLLOW_UP_LEVEL.id}", which is not a level`,
    ])
    const moved = { ...FOLLOW_UP_LEVEL, region: 'process-district' }
    expect(errorsOf(createGameContent({ ...parts([EXAMPLE_LEVEL, moved]), acts: exampleOutline(LEVELS) }))).toContain(
      `level "${moved.id}" belongs to act1/process-district but sits in act1/compilers-quarter`
    )
  })

  it('reports a placement task for no level of the region, or for an objective its level lacks', () => {
    const [act] = exampleOutline(LEVELS)
    const [region] = act?.regions ?? []
    if (!act || !region) {
      throw new Error('no region')
    }
    const task = { levelId: EXAMPLE_LEVEL.id, task: 'Print hello.', files: [], objectives: ['prints-hello'] }
    const withTasks = (tasks: (typeof task)[]) =>
      createGameContent({
        ...parts(),
        acts: [{ ...act, regions: [{ ...region, placement: { offer: 'Show me.', minutes: 5, tasks } }] }],
      })

    expect(errorsOf(withTasks([task]))).toEqual([])
    expect(
      errorsOf(
        withTasks([
          { ...task, objectives: ['prints-hello', 'sings'] },
          { ...task, levelId: 'act1-nowhere-01-x' },
        ])
      )
    ).toEqual([
      `act1/compilers-quarter: a placement task lists "sings", which ${EXAMPLE_LEVEL.id} has no objective for`,
      'act1/compilers-quarter: a placement task stands for "act1-nowhere-01-x", no level of the region',
    ])
  })

  it('reports an act or a region listed twice', () => {
    const [act] = exampleOutline(LEVELS)
    if (!act) {
      throw new Error('no act')
    }
    const twice = createGameContent({ ...parts(), acts: [{ ...act, regions: [...act.regions, ...act.regions] }, act] })

    expect(errorsOf(twice)).toEqual(
      expect.arrayContaining([
        'act "act1" is in the outline more than once',
        'act1: region "compilers-quarter" is in the outline more than once',
      ])
    )
  })

  it("builds each level's checker, and reports one registered for no level", () => {
    const content = createGameContent({ ...parts(), checkers: { [EXAMPLE_LEVEL.id]: EXAMPLE_CHECKER } })
    expect(content.ok && content.value.checker(EXAMPLE_LEVEL.id)).toBeTruthy()
    expect(content.ok && content.value.checker(FOLLOW_UP_LEVEL.id)).toBeUndefined()

    expect(errorsOf(createGameContent({ ...parts(), checkers: { nowhere: EXAMPLE_CHECKER } }))).toEqual([
      'a checker is registered for "nowhere", which is not a level',
    ])
  })

  it('needs a checker of its own for a level that declares checks for only some objectives', () => {
    const [first, second] = EXAMPLE_LEVEL.objectives
    if (!first || !second) {
      throw new Error('the example level has two objectives')
    }
    const partly = { ...EXAMPLE_LEVEL, objectives: [{ ...first, check: { kind: 'compiles' as const } }, second] }

    expect(errorsOf(createGameContent(parts([partly, FOLLOW_UP_LEVEL])))).toEqual([
      `level "${EXAMPLE_LEVEL.id}": objectives "${second.id}" have no check, and the level has no checker of its own`,
    ])
    const withOwn = createGameContent({
      ...parts([partly, FOLLOW_UP_LEVEL]),
      checkers: { [partly.id]: EXAMPLE_CHECKER },
    })
    expect(errorsOf(withOwn)).toEqual([])
  })

  it('reports skill tree problems', () => {
    const content = createGameContent({
      ...parts(),
      skills: [{ id: 'orphan', title: 'Orphan', region: 'nowhere', prerequisites: ['missing-skill'] }],
    })

    expect(errorsOf(content)).toContain('skill "orphan" requires unknown skill "missing-skill"')
  })
})
