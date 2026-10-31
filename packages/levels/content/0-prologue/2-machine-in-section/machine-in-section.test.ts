import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { levelUnderTest, loadedContent } from '#test/index'
import { CONTENT_FILES } from '#utils/loader/index'
import { parseStory, sectionOf } from '#utils/story/index'

const REGION = '0-prologue/2-machine-in-section'
const FOLDERS = [
  '05-kernel-up-close',
  '06-finding-the-hardware',
  '07-who-runs',
  '08-pages-and-maps',
  '09-files-doors-wires',
  '10-bring-it-up',
]
/** The capstone: the placement check never skips it. */
const CAPSTONE = '10-bring-it-up'

/** Skills earned before this region, in First Boot (P.2, P.4). */
const EARLIER_SKILLS = ['sys-user-kernel-mode', 'sys-boot-chain']
/** Cards filed before this region, in First Boot (P.1, P.2), that its cards deepen. */
const EARLIER_CARDS = ['kernel', 'operating-system', 'program-process', 'files', 'user-kernel-mode', 'write-syscall']
/** Every level follows the loop: scene → see it → build it → watch it → debrief → real-world card. */
const LOOP_SECTIONS = ['scene', 'see-it', 'build-it', 'watch-it', 'debrief', 'real-world']

const levels = FOLDERS.map((folder) => ({ folder, ...levelUnderTest(`prologue-machine-in-section-${folder}`) }))

describe('The Machine in Section', () => {
  it('places each level in its slot, in play order', () => {
    const region = parse(CONTENT_FILES.regions[`${REGION}/region.yaml`] ?? '') as { slots: { level?: string }[] }

    expect(region.slots.map((slot) => slot.level)).toEqual(FOLDERS)
  })

  it.each(FOLDERS)('%s has an id from its folders and every story section of the level loop', (folder) => {
    const level = levels.find((candidate) => candidate.folder === folder)?.level
    const story = parseStory(CONTENT_FILES.stories[`${REGION}/${folder}/story.md`] ?? '')

    expect(level?.id).toBe(`prologue-machine-in-section-${folder}`)
    expect(LOOP_SECTIONS.filter((section) => !story.has(section))).toEqual([])
    expect(Object.values(level?.story ?? {}).every((ref) => story.has(sectionOf(ref)))).toBe(true)
  })

  it('needs only skills earned earlier, in First Boot or by an earlier level here', () => {
    const earned = new Set(EARLIER_SKILLS)
    for (const { level } of levels) {
      expect(level.prerequisites.filter((skill) => !earned.has(skill))).toEqual([])
      for (const skill of level.skills) {
        earned.add(skill)
      }
    }
  })

  it('deepens only cards filed earlier, and files each card once', () => {
    const filed = new Set(EARLIER_CARDS)
    for (const { level } of levels) {
      for (const card of level.codex) {
        expect(filed.has(card.id)).toBe(false)
        if (card.deepens !== undefined) {
          expect(filed.has(card.deepens)).toBe(true)
        }
        filed.add(card.id)
      }
    }
  })

  it('declares no Taint rule: none is live in the Prologue', () => {
    expect(levels.flatMap(({ level }) => level.taint)).toEqual([])
  })
})

describe('the placement check', () => {
  const region = loadedContent()
    .acts.flatMap((act) => act.regions)
    .find((candidate) => candidate.id === 'machine-in-section')
  const tasks = (region?.placement?.tasks ?? []).map((task) => ({
    ...task,
    folder: levels.find((candidate) => candidate.level.id === task.levelId)?.folder ?? task.levelId,
  }))

  it('has one task per skippable level, in play order, and never skips the capstone', () => {
    expect(tasks.map((task) => task.folder)).toEqual(FOLDERS.filter((folder) => folder !== CAPSTONE))
  })

  it.each(tasks.map((task) => [task.folder, task] as const))(
    '%s names objectives of its level and files of its starter',
    (folder, task) => {
      const level = levels.find((candidate) => candidate.folder === folder)?.level
      const objectives = new Set(level?.objectives.map((objective) => objective.id))

      expect(task.task).not.toBe('')
      expect(task.objectives.length).toBeGreaterThan(0)
      expect(task.objectives.filter((id) => !objectives.has(id))).toEqual([])
      expect(
        task.files.filter((file) => CONTENT_FILES.starters[`${REGION}/${folder}/starter/${file}`] === undefined)
      ).toEqual([])
    }
  )
})
