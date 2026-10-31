import { describe, expect, it } from 'vitest'
import type { ContentFiles } from '#types/index'
import { CONTENT_FILES } from '#utils/loader/content-files.util'
import { loadContent } from '#utils/loader/load-content.util'

const BOOT_PATH = '0-prologue/1-boot-path'
const FIRST_WORDS = `${BOOT_PATH}/02-first-words`

const errorsOf = (files: ContentFiles): readonly string[] => {
  const loaded = loadContent(files)
  return loaded.ok ? [] : loaded.errors
}

/** The content with one file's text changed. */
function edited(kind: 'acts' | 'regions' | 'levels' | 'stories', path: string, edit: (text: string) => string) {
  const text = CONTENT_FILES[kind][path]
  if (text === undefined) {
    throw new Error(`no ${path}`)
  }
  return { ...CONTENT_FILES, [kind]: { ...CONTENT_FILES[kind], [path]: edit(text) } }
}

function loaded() {
  const result = loadContent(CONTENT_FILES)
  if (!result.ok) {
    throw new Error(result.errors.join('\n'))
  }
  return result.value
}

describe('loadContent', () => {
  it('accepts all the content in the repository', () => {
    expect(errorsOf(CONTENT_FILES)).toEqual([])
  })

  it('puts the acts, regions and levels in folder order', () => {
    const content = loaded()

    expect(content.acts.map((act) => act.act)).toEqual(['prologue', 'act1', 'act2', 'act3'])
    expect(content.acts[0]?.regions.map((region) => region.id)).toEqual([
      'boot-path',
      'machine-in-section',
      'surface-survey',
    ])
    expect(content.acts[3]?.regions.at(-1)?.id).toBe('mainline')
    expect(content.game.levels.slice(0, 5).map((level) => level.id)).toEqual([
      'prologue-boot-path-01-power-on',
      'prologue-boot-path-02-first-words',
      'prologue-boot-path-03-speak-to-shell',
      'prologue-boot-path-04-the-boot-path',
      'prologue-machine-in-section-05-kernel-up-close',
    ])
  })

  it('finds a level by its place, its folder and the level after it', () => {
    const content = loaded()

    expect(content.placeOf('act1-process-district-04-run-anything')?.slot.number).toBe('1.4')
    expect(content.folderOf('prologue-boot-path-02-first-words')).toBe(FIRST_WORDS)
    expect(content.nextLevel('prologue-boot-path-02-first-words')).toBe('prologue-boot-path-03-speak-to-shell')
    expect(content.nextLevel(content.game.levels.at(-1)?.id ?? '')).toBeNull()
    expect(content.nextLevel('nope')).toBeNull()
  })

  it("draws the map's layers top to bottom, each region in its own, its act's or another act's", () => {
    const content = loaded()
    const layerOf = (act: number, region: string) => content.acts[act]?.regions.find((r) => r.id === region)?.layer

    expect(content.layers.map((layer) => layer.key)).toEqual(['surface', 'userland', 'gate', 'deep', 'core', 'bedrock'])
    expect(layerOf(0, 'boot-path')).toBe('surface')
    expect(layerOf(0, 'surface-survey')).toBe('userland')
    expect(layerOf(1, 'syscall-gate')).toBe('gate')
  })

  it('keeps the stories and starters of each level', () => {
    const content = loaded()

    expect(content.stories.get('prologue-boot-path-02-first-words')?.has('scene')).toBe(true)
    expect(Object.keys(content.starters.get('prologue-boot-path-02-first-words') ?? {})).toEqual(['hello.c'])
  })

  it('reports every problem with its file instead of throwing', () => {
    const errors = errorsOf(edited('levels', `${FIRST_WORDS}/level.yaml`, () => 'id: ['))

    expect(errors.some((error) => error.startsWith(`${FIRST_WORDS}/level.yaml: not valid YAML`))).toBe(true)
  })

  it("gives each level the act and region of its folders, which level.yaml doesn't name", () => {
    const content = loaded()
    const placeOf = (id: string) => {
      const level = content.game.level(id)
      return level ? [level.act, level.region] : null
    }
    expect(placeOf('prologue-boot-path-01-power-on')).toEqual(['prologue', 'boot-path'])
    expect(placeOf('act1-process-district-04-run-anything')).toEqual(['act1', 'process-district'])
    const errors = errorsOf(edited('levels', `${FIRST_WORDS}/level.yaml`, (text) => `${text}act: prologue\n`))
    expect(errors.some((error) => error.startsWith(`${FIRST_WORDS}/level.yaml: act: unknown field`))).toBe(true)
  })

  it('rejects a level in an act folder without act.yaml', () => {
    const errors = errorsOf({
      ...CONTENT_FILES,
      levels: { ...CONTENT_FILES.levels, '9-nowhere/1-street/01-door/level.yaml': 'id: x' },
    })
    expect(errors).toContain('9-nowhere/1-street/01-door/level.yaml: its act folder has no act.yaml')
  })

  it("rejects a level whose id doesn't come from its act, region and folder", () => {
    const errors = errorsOf(
      edited('levels', `${FIRST_WORDS}/level.yaml`, (text) =>
        text.replace('id: prologue-boot-path-02-first-words', 'id: prologue-boot-path-03-first-words')
      )
    )

    expect(errors).toContain(
      `${FIRST_WORDS}/level.yaml: id "prologue-boot-path-03-first-words" must be "prologue-boot-path-02-first-words" (act, region and folder)`
    )
  })

  it('rejects a slot that names no level folder, and a level no slot names', () => {
    const errors = errorsOf(
      edited('regions', `${BOOT_PATH}/region.yaml`, (text) =>
        text.replace('level: 02-first-words', 'level: 05-elsewhere')
      )
    )

    expect(errors).toEqual(
      expect.arrayContaining([
        `${BOOT_PATH}/region.yaml: slot P.2 names the folder 05-elsewhere, which has no level.yaml`,
        `${FIRST_WORDS}: no slot of its region.yaml names this level`,
      ])
    )
  })

  it("rejects a region whose id doesn't match its folder", () => {
    const errors = errorsOf(
      edited('regions', `${BOOT_PATH}/region.yaml`, (text) => text.replace('id: boot-path', 'id: boot'))
    )

    expect(errors).toContain(`${BOOT_PATH}/region.yaml: id "boot" must match its folder "1-boot-path" after the number`)
  })

  it('rejects a folder without its play-order number, and a region outside any act', () => {
    const errors = errorsOf({
      ...CONTENT_FILES,
      regions: { ...CONTENT_FILES.regions, 'prologue/boot/region.yaml': 'id: boot' },
    })

    expect(errors).toContain('prologue/boot/region.yaml: its act folder has no act.yaml')
  })

  it('rejects a region drawn in a layer nobody defines', () => {
    const survey = '0-prologue/3-surface-survey/region.yaml'
    const errors = errorsOf(edited('regions', survey, (text) => text.replace('inLayer: userland', 'inLayer: attic')))

    expect(errors).toContain('prologue/surface-survey: drawn in the layer "attic", which no act or region defines')
  })

  it('rejects a level whose story is missing a referenced section', () => {
    const errors = errorsOf(
      edited('stories', `${FIRST_WORDS}/story.md`, (text) => text.replace('## Debrief', '## Later'))
    )

    expect(errors).toContain(`${FIRST_WORDS}/story.md: no section for "story.md#debrief"`)
  })
})

describe('loadContent: placement checks', () => {
  const PLACEMENT = `${BOOT_PATH}/placement.yaml`
  const placement = (files: string) =>
    [
      'offer: Seen this before? Show me.',
      'minutes: 3',
      'tasks:',
      '  - level: 02-first-words',
      '    task: Make hello.c print a line.',
      `    files: [${files}]`,
      '    objectives: [compiles, writes-stdout]',
    ].join('\n')
  const withPlacement = (text: string) => ({
    ...CONTENT_FILES,
    placements: { ...CONTENT_FILES.placements, [PLACEMENT]: text },
  })

  it("reads a region's placement.yaml, naming each task's level by id", () => {
    const loaded = loadContent(withPlacement(placement('hello.c')))
    const region = loaded.ok
      ? loaded.value.acts[0]?.regions.find((candidate) => candidate.id === 'boot-path')
      : undefined

    expect(region?.placement?.tasks).toEqual([
      {
        levelId: 'prologue-boot-path-02-first-words',
        task: 'Make hello.c print a line.',
        files: ['hello.c'],
        objectives: ['compiles', 'writes-stdout'],
      },
    ])
  })

  it("reports a task that opens a file its level's starter doesn't have", () => {
    expect(errorsOf(withPlacement(placement('nope.c')))).toContain(
      `${PLACEMENT}: the task for 02-first-words opens nope.c, which its starter doesn't have`
    )
  })

  it('reports a placement.yaml that fails its checks with its path', () => {
    expect(errorsOf(withPlacement('offer: Show me.\nminutes: 3\ntasks: []'))).toContain(
      `${PLACEMENT}: tasks: expected at least one task`
    )
  })
})

describe('loadContent: the Field Guide', () => {
  it('reads field-guide.yaml, and reports a slot the outline does not have', () => {
    const content = loadContent(CONTENT_FILES)
    expect(content.ok && content.value.game.fieldGuide?.opensAt).toBe('P.3')

    const errors = errorsOf({ ...CONTENT_FILES, fieldGuide: 'opensAt: "P.99"\nentries: []' })
    expect(errors).toContain('field guide: opens at "P.99", which is no slot of the outline')
  })
})
