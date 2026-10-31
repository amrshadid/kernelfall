import type { BuildHistory, CheckVerdict, LevelId } from '@kernelfall/game/types'
import { compileReport, evaluateCheck, mergeVerdicts } from '@kernelfall/game/utils'
import { describe, expect, it } from 'vitest'
import { loadedContent, recordedRun, recordedRunNames } from '#test/index'

const RUN_ANYTHING = 'act1-process-district-04-run-anything'
const FIRST_WORDS = 'prologue-boot-path-02-first-words'
const SPEAK_TO_SHELL = 'prologue-boot-path-03-speak-to-shell'

/** Built levels the real Machine can't play yet, and why; every other one has recorded runs. */
const NOT_ON_THE_VM: Readonly<Record<LevelId, string>> = {}

/** Objectives a reference run can't meet on the real Machine yet, and why; each must stay missing until fixed. */
const KNOWN_GAPS: Readonly<Record<LevelId, Readonly<Record<string, string>>>> = {}

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

  it('builds and exits 0 with the starter, but writes nothing', () => {
    const missing = verdictOf(FIRST_WORDS, ['silent'])?.missing.map(({ id }) => id)

    expect(missing).toEqual(['writes-stdout', 'ends-in-newline'])
  })

  it('misses only the newline when the line has none', () => {
    expect(verdictOf(FIRST_WORDS, ['no-newline'])?.missing.map(({ id }) => id)).toEqual(['ends-in-newline'])
  })

  it("passes with printf(), which musl's stdio sends as a writev", () => {
    expect(verdictOf(FIRST_WORDS, ['solution-printf'])?.missing).toEqual([])
  })

  it("reads the real gcc's error from the broken build, and none from the fixed one", () => {
    const broken = recordedRun(FIRST_WORDS, 'broken').map(compileReport)
    const fixed = recordedRun(FIRST_WORDS, 'solution').map(compileReport)

    expect(broken.find((report) => report !== null)?.errors).toBeGreaterThan(0)
    expect(fixed.find((report) => report !== null)).toEqual({ errors: 0, warnings: [] })
  })
})

describe('Speak to the Shell', () => {
  it('meets what happens inside the shell: Tab, env and a command not found', () => {
    expect(report(SPEAK_TO_SHELL, 'solution').met).toEqual(
      expect.arrayContaining(['completes-a-command', 'completes-a-file', 'env-adds-a-setting', 'not-found'])
    )
  })

  it('meets nothing with each errand almost done', () => {
    expect(verdictOf(SPEAK_TO_SHELL, ['near-misses'])?.missing.map(({ id }) => id)).toEqual(
      content.game.level(SPEAK_TO_SHELL)?.objectives.map(({ id }) => id)
    )
  })
})

describe('The Boot Path', () => {
  const missing = (run: string) =>
    verdictOf('prologue-boot-path-04-the-boot-path', [run])
      ?.missing.map(({ id }) => id)
      .sort()

  it('misses only the quiet boot when quiet stays on the line: dmesg still holds every line', () => {
    expect(missing('kept-quiet')).toEqual(['booted-your-way'])
  })

  it("meets only the BIOS check with GRUB's entry booted as it is", () => {
    expect(missing('plain-boot')).toEqual(['booted-your-way', 'initcalls-logged', 'passed-to-init'])
  })
})

describe('The Machine in Section', () => {
  const missing = (level: string, run: string) =>
    verdictOf(`prologue-machine-in-section-${level}`, [run])
      ?.missing.map(({ id }) => id)
      .sort()

  it("rejects the starters' runs for what each still lacks", () => {
    expect(missing('05-kernel-up-close', 'starter')).toEqual(['compares-uname', 'poke-segfaults', 'prints-machine'])
    expect(missing('06-finding-the-hardware', 'starter')).toEqual(['lamp-binds', 'reads-disk-driver'])
    expect(missing('07-who-runs', 'starter')).toEqual(['prints-parent-pid', 'reads-proc-status', 'shares-one-cpu'])
    expect(missing('08-pages-and-maps', 'starter')).toEqual(['local-on-stack', 'prints-maps', 'reads-meminfo'])
  })

  it('rejects a crash on a user address and a line typed in without asking the kernel', () => {
    expect(missing('05-kernel-up-close', 'impostors')).toEqual([
      'asks-uname',
      'compares-uname',
      'poke-segfaults',
      'prints-machine',
    ])
  })

  it('takes nothing from /dev/null, which answers end of file at once', () => {
    expect(missing('09-files-doors-wires', 'dev-null')).toEqual(['reads-9p', 'reads-procfs', 'reads-sysfs'])
  })

  it('comes up without its network driver and with 64 MiB when only root= is fixed', () => {
    expect(missing('10-bring-it-up', 'root-only')).toEqual(['card-bound', 'full-memory', 'operstate-up'])
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
