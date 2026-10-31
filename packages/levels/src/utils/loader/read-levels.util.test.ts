import type { ActFile } from '@kernelfall/game/types'
import { validateAct } from '@kernelfall/game/utils'
import { describe, expect, it } from 'vitest'
import { CONTENT_FILES } from '#utils/loader/content-files.util'
import { childFolders, locationOf, readLevels } from '#utils/loader/read-levels.util'
import { readYaml } from '#utils/loader/read-yaml.util'

const PROLOGUE = '0-prologue'
const FIRST_WORDS = `${PROLOGUE}/1-boot-path/02-first-words`

function prologueActs(): ReadonlyMap<string, ActFile> {
  const path = `${PROLOGUE}/act.yaml`
  const act = readYaml(CONTENT_FILES.acts[path] ?? '', path, validateAct, [])
  return new Map(act ? [[PROLOGUE, act]] : [])
}

describe('childFolders', () => {
  it('lists the folders directly under a parent, in play order', () => {
    const errors: string[] = []
    const paths = ['2-b/region.yaml', '1-a/region.yaml', '1-a/1-x/region.yaml']
    expect(childFolders(paths, null, errors)).toEqual(['1-a', '2-b'])
    expect(childFolders(paths, '1-a', errors)).toEqual(['1-a/1-x'])
    expect(errors).toEqual([])
  })

  it('reports a folder without its play-order number', () => {
    const errors: string[] = []
    childFolders(['boot/region.yaml'], null, errors)
    expect(errors).toEqual(['boot: a folder name starts with its place in play order, like 1-boot'])
  })
})

describe('locationOf', () => {
  it("names a level's act and region from its folders", () => {
    expect(locationOf(FIRST_WORDS, CONTENT_FILES, prologueActs(), [])).toEqual({
      act: 'prologue',
      region: 'boot-path',
    })
  })

  it('reports a level whose act folder has no act.yaml', () => {
    const errors: string[] = []
    expect(locationOf('9-nowhere/1-street/01-door', CONTENT_FILES, prologueActs(), errors)).toBeNull()
    expect(errors).toEqual(['9-nowhere/1-street/01-door/level.yaml: its act folder has no act.yaml'])
  })
})

describe('readLevels', () => {
  it('reads each level of a readable act with its story and starter code', () => {
    const errors: string[] = []
    const levels = readLevels(CONTENT_FILES, prologueActs(), errors)
    const firstWords = levels.get(FIRST_WORDS)

    expect(firstWords?.level.id).toBe('prologue-boot-path-02-first-words')
    expect(firstWords?.story.has('scene')).toBe(true)
    expect(Object.keys(firstWords?.starter ?? {})).toEqual(['hello.c'])
  })
})
