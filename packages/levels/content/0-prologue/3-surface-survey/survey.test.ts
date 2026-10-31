import { describe, expect, it } from 'vitest'
import { INIT_PID, PENDING_FIELD, STOPPED_LINE } from '#content/0-prologue/3-surface-survey/03-processes/checker.ts'
import { DENIED, PASSWD } from '#content/0-prologue/3-surface-survey/04-finding-things/checker.ts'
import { allMetBy } from '#content/0-prologue/3-surface-survey/survey.fixture.ts'
import { levelUnderTest, loadedContent, recordedRun, verdictOf } from '#test/index'
import { machineFacts } from '#test/machine-facts'
import { CONTENT_FILES } from '#utils/loader/index'
import { parseStory } from '#utils/story/index'

const REGION = '0-prologue/3-surface-survey'
const FOLDERS = ['01-streets', '02-who-may-enter', '03-processes', '04-finding-things', '05-text-tools']
const LOOP_SECTIONS = ['scene', 'see-it', 'build-it', 'watch-it', 'debrief', 'real-world']
const idOf = (folder: string) => `prologue-surface-survey-${folder}`
const story = (folder: string) => CONTENT_FILES.stories[`${REGION}/${folder}/story.md`] ?? ''
const facts = machineFacts().outputs
const fact = (command: string) => facts[command] ?? ''

const missing = (folder: string, run: string) =>
  verdictOf(levelUnderTest(idOf(folder)), recordedRun(idOf(folder), run))?.missing.map(({ id }) => id) ?? []
const metPerCommand = (folder: string, run: string) =>
  recordedRun(idOf(folder), run).map((events) => allMetBy(levelUnderTest(idOf(folder)), events))
const CD_IDS = ['cd-absolute', 'cd-up', 'relative-path']

describe('The Surface Survey', () => {
  it.each(FOLDERS)('%s has every story section of the level loop', (folder) => {
    const sections = parseStory(story(folder))
    expect(LOOP_SECTIONS.filter((section) => !sections.has(section))).toEqual([])
  })

  it('hands each debrief on to the next level, and the last to Act I', () => {
    const titles = ['Who May Enter', 'Processes from Outside', 'Finding Things', 'Counting and Sorting']
    const debrief = (folder: string) => story(folder).split('## Debrief')[1]?.split('## Real world')[0] ?? ''
    titles.forEach((title, i) => {
      expect(debrief(FOLDERS[i] ?? '')).toContain(title)
    })
    expect(debrief('05-text-tools')).toContain('1.4, Run Anything')
  })

  it('quotes the Machine as its facts recorded it', () => {
    expect(story('01-streets')).toContain(fact('ls /'))
    expect(story('01-streets')).toContain("rmdir: '../notes': Directory not empty")
    expect(fact('rmdir /etc')).toBe("rmdir: '/etc': Directory not empty")
    expect(story('02-who-may-enter')).toContain(fact('cat /etc/shadow'))
    expect(story('02-who-may-enter')).toContain(fact('id'))
    expect(story('02-who-may-enter')).toContain(fact('chmod 600 /etc/motd'))
    expect(story('05-text-tools')).toContain(fact('cat /etc/passwd').split('\n').at(-1) ?? '')
  })
})

describe('the facts the checkers rely on', () => {
  it("S.3's init is PID 1, and /proc prints State and ShdPnd lines", () => {
    expect(fact('ps')).toContain(`    ${INIT_PID} root      0:00 /sbin/init`)
    expect(fact('cat /proc/$$/status')).toMatch(/^State:\t[A-Z] \(/m)
    expect(STOPPED_LINE).toMatch(/^State:\tT \(stopped\)$/)
    expect(fact('cat /proc/$$/status')).toMatch(new RegExp(`^${PENDING_FIELD}\\t[0-9a-f]{16}$`, 'm'))
  })

  it("S.4's refusal and result are BusyBox find's", () => {
    expect(fact('find /root')).toContain(`find: /root: ${DENIED}`)
    expect(fact('ls -l /etc/passwd /etc/shadow /etc/motd')).toContain(PASSWD)
  })

  it("S.5's own line is in /etc/passwd", () => {
    const check = levelUnderTest(idOf('05-text-tools')).level.objectives.find((o) => o.id === 'own-passwd-line')?.check
    const line = check?.kind === 'wrote' ? check.text?.contains : undefined
    expect(line).toBeDefined()
    expect(fact('cat /etc/passwd')).toContain(line)
  })
})

describe('the runs each checker must reject', () => {
  it('S.1: a copy and a delete is no rename, and the tree is wrong', () => {
    expect(missing('01-streets', 'copy-not-rename')).toEqual(expect.arrayContaining(['rename-no-bytes', 'survey-tree']))
  })

  it('S.1: `cd /` is no climb, and neither cd nor an absolute or plain name hands the kernel a relative walk', () => {
    const met = metPerCommand('01-streets', 'no-dots')
    expect(met.map((ids) => ids.filter((id) => CD_IDS.includes(id)))).toEqual([['cd-absolute'], [], [], [], []])
    expect(metPerCommand('01-streets', 'solution').flat()).toEqual(expect.arrayContaining(CD_IDS))
  })

  it('S.2: a note the group may read, or nobody, is not private', () => {
    expect(missing('02-who-may-enter', 'not-private')).toContain('note-private')
  })

  it("S.2: a refused execve of something other than hi isn't the lesson", () => {
    expect(missing('02-who-may-enter', 'not-hi')).toContain('exec-denied')
  })

  it('S.3: ending yes without pausing it shows no stop and no pending signal', () => {
    const left = missing('03-processes', 'kill-without-stop')
    expect(left).toEqual(expect.arrayContaining(['paused-yes', 'saw-pending']))
    expect(left).not.toContain('yes-ended')
  })

  it("S.3: ps without names can't show yes or sleep gone, and init's status isn't theirs", () => {
    expect(missing('03-processes', 'pids-only')).toEqual(
      expect.arrayContaining(['read-status', 'yes-ended', 'sleep-ended'])
    )
  })

  it('S.4: a wildcard finds many files, and > keeps only standard output', () => {
    expect(missing('04-finding-things', 'results-away')).toEqual(
      expect.arrayContaining(['found-plan', 'two-streams', 'errors-away'])
    )
  })

  it('S.4: standard error kept in a file is not thrown away', () => {
    expect(missing('04-finding-things', 'errors-to-file')).toContain('errors-away')
  })

  it('S.5: wc -l counts the dark houses through a pipe, but not the lit ones or the words', () => {
    const met = metPerCommand('05-text-tools', 'piped-count')
    expect(met.map((ids) => ids.includes('counted-dark'))).toEqual([false, false, true])
  })

  it('S.5: uniq on unsorted lines, and a reversed sort, are rejected', () => {
    expect(missing('05-text-tools', 'unsorted')).toEqual(
      expect.arrayContaining(['counted-kinds', 'piped-counts', 'sorted-file'])
    )
  })
})

describe('the placement check', () => {
  const region = loadedContent()
    .acts.flatMap((act) => act.regions)
    .find((candidate) => candidate.id === 'surface-survey')
  const tasks = region?.placement?.tasks ?? []

  it('has one task per level, in play order', () => {
    expect(tasks.map((task) => task.levelId)).toEqual(FOLDERS.map(idOf))
  })

  it.each(tasks.map((task) => [task.levelId, task] as const))(
    "%s's task names objectives its solution run meets",
    (levelId, task) => {
      const level = levelUnderTest(levelId)
      const met = new Set(recordedRun(levelId, 'solution').flatMap((events) => allMetBy(level, events)))
      expect(task.objectives.filter((id) => !met.has(id))).toEqual([])
    }
  )
})
