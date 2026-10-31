import type { BuildHistory, CheckVerdict, LevelId } from '@kernelfall/game/types'
import { compileReport, evaluateCheck, mergeVerdicts } from '@kernelfall/game/utils'
import { describe, expect, it } from 'vitest'
import { loadedContent, recordedRun, recordedRunNames } from '#test/index'

const RUN_ANYTHING = 'act1-process-district-04-run-anything'
const FIRST_WORDS = 'prologue-boot-path-02-first-words'

/** Built levels the real Machine can't play yet, and why; every other one has recorded runs. */
const NOT_ON_THE_VM: Readonly<Record<LevelId, string>> = {
  'prologue-boot-path-04-the-boot-path':
    'boots through GRUB with arguments of its own (lab.boot); the VM has no disk to boot from',
  'prologue-machine-in-section-06-finding-the-hardware':
    'needs dtc and the lighthouse board program, which the image lacks',
  'prologue-machine-in-section-10-bring-it-up': 'needs GRUB, lab.boot and an e1000 card; v86 has none of them',
}

// sendfile64 (BusyBox cat into a file or pipe) carries no data in the trace; what cat prints to the
// terminal does, as console_write.
const SENDFILE = 'BusyBox cat copies with sendfile64, which carries no data'
/** Objectives a reference run can't meet on the real Machine yet, and why; each must stay missing until fixed. */
const KNOWN_GAPS: Readonly<Record<LevelId, Readonly<Record<string, string>>>> = {
  'prologue-machine-in-section-08-pages-and-maps': { 'reads-meminfo': SENDFILE },
  'prologue-surface-survey-02-who-may-enter': {
    'note-private': 'unexplained since the trace rework: investigate before the content pass',
    'neighbour-denied': "init's knock as guest (useRunAs) isn't in the reference run yet",
  },
  'prologue-surface-survey-04-finding-things': { 'read-plan': SENDFILE },
}

/** The build history the app passes: P.2's player broke the build and fixed it. */
const BUILDS: Readonly<Record<LevelId, BuildHistory>> = {
  [FIRST_WORDS]: { failedEarlier: true, latestErrors: 0 },
}

const content = loadedContent()
const runs = recordedRunNames()
const runsOf = (levelId: LevelId) =>
  runs.filter((name) => name.startsWith(`${levelId}/`)).map((name) => name.slice(levelId.length + 1))

function checkerOf(levelId: LevelId) {
  const checker = content.game.checker(levelId)
  if (!checker) {
    throw new Error(`${levelId} has no checker`)
  }
  return checker
}

/** The verdict over every command of the runs, merged as the game merges a play-through. */
function verdictOf(levelId: LevelId, names: readonly string[]): CheckVerdict | null {
  const level = content.game.level(levelId)
  if (!level) {
    throw new Error(`no level ${levelId}`)
  }
  const builds = BUILDS[levelId]
  return names
    .flatMap((name) => recordedRun(levelId, name))
    .reduce<CheckVerdict | null>(
      (previous, events) =>
        mergeVerdicts(previous, evaluateCheck(level, checkerOf(levelId), builds ? { events, builds } : { events })),
      null
    )
}

/** What a level's checker.ts reports over one recorded run's commands. */
function report(levelId: LevelId, run: string) {
  const checker = checkerOf(levelId)
  const met = new Set<string>()
  const taint: { ruleId: string }[] = []
  let applies = false
  for (const events of recordedRun(levelId, run)) {
    applies ||= checker.applies?.({ events }) ?? true
    const result = checker.check({ events })
    for (const id of result.objectivesMet) {
      met.add(id)
    }
    taint.push(...result.taint)
  }
  return { applies, met: [...met].sort(), taint }
}

describe('every built level', () => {
  it('has a checker, and runs recorded on the real Machine unless it cannot run there yet', () => {
    const levels = content.game.levels
    const playable = levels.filter((level) => NOT_ON_THE_VM[level.id] === undefined).map((level) => level.id)

    expect(levels.filter((level) => !content.game.checker(level.id)).map((level) => level.id)).toEqual([])
    expect(
      playable.filter((id) => !runsOf(id).includes('solution') && !runsOf(id).some((r) => r.startsWith('solution-')))
    ).toEqual([])
  })

  it.each(content.game.levels.filter((level) => NOT_ON_THE_VM[level.id] === undefined).map((level) => level.id))(
    '%s passes with its reference runs and zero Taint, but for its known gaps',
    (levelId) => {
      const solutions = runsOf(levelId).filter((name) => name === 'solution' || name.startsWith('solution-'))
      const verdict = verdictOf(levelId, solutions)

      expect(verdict?.missing.map(({ id }) => id).sort()).toEqual(Object.keys(KNOWN_GAPS[levelId] ?? {}).sort())
      expect(verdict?.taint).toEqual([])
    }
  )
})

describe('First Words', () => {
  it("doesn't build or run with the `;` deleted", () => {
    const missing = verdictOf(FIRST_WORDS, ['broken'])?.missing.map(({ id }) => id)

    expect(missing).toEqual(expect.arrayContaining(['compiles', 'exits-zero', 'writes-stdout']))
  })

  it("reads the real gcc's error from the broken build, and none from the fixed one", () => {
    const broken = recordedRun(FIRST_WORDS, 'broken').map(compileReport)
    const fixed = recordedRun(FIRST_WORDS, 'solution').map(compileReport)

    expect(broken.find((report) => report !== null)?.errors).toBeGreaterThan(0)
    expect(fixed.find((report) => report !== null)).toEqual({ errors: 0, warnings: [] })
  })
})

describe('Run Anything', () => {
  it('meets each objective in the session that shows it', () => {
    expect(report(RUN_ANYTHING, 'solution')).toEqual({
      applies: true,
      met: ['exit-status', 'no-zombies', 'not-found', 'runs-ls', 'runs-path'],
      taint: [],
    })
    expect(report(RUN_ANYTHING, 'solution-not-found-exit')).toEqual({
      applies: true,
      met: ['exit-127', 'not-found'],
      taint: [],
    })
    expect(report(RUN_ANYTHING, 'solution-fork-fails')).toMatchObject({ met: ['fork-fails'], taint: [] })
  })

  it('meets nothing with the starter, whose run_external() is a stub', () => {
    expect(report(RUN_ANYTHING, 'starter')).toEqual({ applies: true, met: [], taint: [] })
  })

  it('reports zombies when the shell never waits', () => {
    const verdict = verdictOf(RUN_ANYTHING, ['no-wait'])
    const { met } = report(RUN_ANYTHING, 'no-wait')

    expect(met).not.toContain('runs-ls')
    expect(met).not.toContain('exit-status')
    expect(verdict?.taint).toEqual([expect.objectContaining({ ruleId: 'zombies-left' })])
  })

  it('reports waitpid(-1) after a fork() that failed', () => {
    const { met, taint } = report(RUN_ANYTHING, 'ignored-fork-error')

    expect(met).toEqual(['fork-fails'])
    expect(taint).toEqual([expect.objectContaining({ ruleId: 'ignored-fork-error' })])
  })

  it('reports exit() in the child when it prints the prompt left in stdout a second time', () => {
    expect(report(RUN_ANYTHING, 'exit-in-child').taint).toEqual([expect.objectContaining({ ruleId: 'exit-in-child' })])
    // Flushed before fork(): exit() had nothing to print twice, so the events can't tell it from _exit().
    expect(report(RUN_ANYTHING, 'exit-in-child-flushed').taint).toEqual([])
  })

  it("doesn't judge a command typed straight into bash", () => {
    expect(checkerOf(RUN_ANYTHING).applies?.({ events: [] })).toBe(false)
  })
})
