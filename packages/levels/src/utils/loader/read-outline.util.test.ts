import { describe, expect, it } from 'vitest'
import { parse, stringify } from 'yaml'
import type { ContentFiles } from '#types/index'
import { CONTENT_FILES } from '#utils/loader/content-files.util'
import { loadContent } from '#utils/loader/load-content.util'
import { checkLayers } from '#utils/loader/read-outline.util'

const DISTRICT = '1-act-1/2-process-district'
const RUN_ANYTHING = `${DISTRICT}/04-run-anything/level.yaml`

function loaded(files: ContentFiles = CONTENT_FILES) {
  const result = loadContent(files)
  if (!result.ok) {
    throw new Error(result.errors.join('\n'))
  }
  return result.value
}

function slotOf(files: ContentFiles, number: string) {
  const slots = loaded(files).acts.flatMap((act) => act.regions.flatMap((region) => region.slots))
  return slots.find((slot) => slot.number === number)
}

/** 1.4's slot with `slot` as its summary, and its level.yaml with `level` (or none). */
function runAnything(slot: string, level: string | null): ContentFiles {
  return runAnythingWith({ summary: slot }, level === null ? null : `summary: ${level}`)
}

type SlotYaml = Record<string, unknown>

/** 1.4's slot with the fields `slot`, and its level.yaml with `level` added (or no summary or minutes). */
function runAnythingWith(slot: SlotYaml, level: string | null): ContentFiles {
  // Parsed, not pattern-matched, so the test survives the formatter reflowing the file.
  const region = parse(CONTENT_FILES.regions[`${DISTRICT}/region.yaml`] ?? '') as { slots: SlotYaml[] }
  region.slots = region.slots.map(({ summary, minutes, ...rest }) =>
    rest.number === '1.4' ? { ...rest, ...slot } : { ...rest, summary, minutes }
  )
  const yaml = (CONTENT_FILES.levels[RUN_ANYTHING] ?? '').replace(/^(summary|minutes):.*\n/gm, '')
  return {
    ...CONTENT_FILES,
    regions: { ...CONTENT_FILES.regions, [`${DISTRICT}/region.yaml`]: stringify(region) },
    levels: {
      ...CONTENT_FILES.levels,
      [RUN_ANYTHING]: level === null ? yaml : yaml.replace(/^title: (.*)$/m, `title: $1\n${level}`),
    },
  }
}

describe('readOutline: summaries', () => {
  it('gives every planned slot of Acts I to III a summary for the map', () => {
    const planned = loaded()
      .acts.filter((act) => act.act !== 'prologue')
      .flatMap((act) => act.regions.flatMap((region) => region.slots))
      .filter((slot) => slot.levelId === null)
    expect(planned.length).toBeGreaterThan(0)
    expect(planned.filter((slot) => !slot.summary).map((slot) => slot.number)).toEqual([])
  })

  it("keeps a built level's own summary over its slot's", () => {
    expect(slotOf(runAnything('From the slot.', 'From the level.'), '1.4')?.summary).toBe('From the level.')
  })

  it("falls back to the slot's summary while the level has none", () => {
    expect(slotOf(runAnything('From the slot.', null), '1.4')?.summary).toBe('From the slot.')
  })
})

describe('readOutline: minutes', () => {
  it("keeps a built level's own minutes over its slot's, and falls back to the slot's", () => {
    expect(slotOf(runAnythingWith({ minutes: 30 }, 'minutes: 45'), '1.4')?.minutes).toBe(45)
    expect(slotOf(runAnythingWith({ minutes: 30 }, null), '1.4')?.minutes).toBe(30)
  })

  it('gives every built Prologue level a summary and minutes from its spec', () => {
    const prologue = loaded().acts.find((act) => act.act === 'prologue')
    const built = (prologue?.regions ?? [])
      .flatMap((region) => region.slots)
      .filter((slot) => slot.levelId !== null && slot.number.startsWith('P.'))
    expect(built.length).toBe(10)
    expect(built.filter((slot) => !slot.summary || !slot.minutes).map((slot) => slot.number)).toEqual([])
  })
})

describe('checkLayers', () => {
  it('accepts the layers the content defines', () => {
    const { acts, layers } = loaded()
    const errors: string[] = []
    checkLayers(acts, layers, errors)
    expect(errors).toEqual([])
  })

  it('reports a layer defined twice, and a region drawn in a layer nobody defines', () => {
    const { acts, layers } = loaded()
    const [surface, ...rest] = layers
    const errors: string[] = []
    checkLayers(acts, [...rest, ...rest.slice(0, 1)], errors)

    expect(errors).toContain(`map layer "${rest[0]?.key}" is defined more than once`)
    expect(errors).toContain(`prologue/boot-path: drawn in the layer "${surface?.key}", which no act or region defines`)
  })
})
